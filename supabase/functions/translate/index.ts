// supabase/functions/translate/index.ts — FR-TRANSLATE-002 (Phase 1b)
//
// Demand-driven, single-target translation of one content field. Server-owned:
// holds the provider key + a service-role client (cache is service-role-write-only).
//
// POST { contentType: 'post'|'message', contentId: uuid, field: 'title'|'description'|'body',
//        targetLanguage: BCP-47, sourceText: string }
//   → 200 { status:'translated'|'cached'|'skipped', translation?: {...} }
//   → 400 { error:'invalid_body' }   401 { error:'unauthorized' }
//   → 403 { error:'forbidden' }      405 { error:'method_not_allowed' }
//   → 502 { error:'provider_failed' } 500 { error:'internal' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { getAuthedUser } from './auth.ts';
import { isTranslatable, needsTranslation } from '../_shared/translation/shortcircuit.ts';
import { getCached, putIfAbsent, type CacheKey } from './cache.ts';
import { selectProvider } from '../_shared/translation/provider.ts';
import { isSupportedTarget } from '../_shared/translation/supportedLanguages.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAX_INPUT = 5000; // input-length cap (§9 key-drain guard)

const FIELDS_BY_TYPE: Record<string, string[]> = {
  post: ['title', 'description'],
  message: ['body'],
};
// Which source table/PK to RLS-check for visibility before spending a call, plus
// the DB column each field maps to. The text we translate is READ FROM THIS ROW
// (not client-supplied) so a malicious client cannot poison the shared cache.
const SOURCE: Record<string, { table: string; pk: string; fields: Record<string, string> }> = {
  post: { table: 'posts', pk: 'post_id', fields: { title: 'title', description: 'description' } },
  message: { table: 'messages', pk: 'message_id', fields: { body: 'body' } },
};

function json(body: unknown, status: number, h: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...h },
  });
}

interface Body {
  contentType: string;
  contentId: string;
  field: string;
  targetLanguage: string;
  sourceText: string;
}

function isValid(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (!(typeof o.contentType === 'string' && FIELDS_BY_TYPE[o.contentType])) return false;
  if (typeof o.contentId !== 'string' || !o.contentId) return false;
  if (typeof o.field !== 'string' || !FIELDS_BY_TYPE[o.contentType].includes(o.field)) return false;
  if (typeof o.targetLanguage !== 'string' || !o.targetLanguage) return false;
  if (typeof o.sourceText !== 'string' || o.sourceText.length === 0) return false;
  if (o.sourceText.length > MAX_INPUT) return false;
  return true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return isAllowedOrigin(origin)
      ? new Response('ok', { status: 200, headers: corsHeaders(origin) })
      : json({ error: 'origin_not_allowed' }, 403);
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const hdrs = isAllowedOrigin(origin) ? corsHeaders(origin) : {};

  const authed = await getAuthedUser(req);
  if (!authed) return json({ error: 'unauthorized' }, 401, hdrs);

  let body: Body;
  try {
    const raw = await req.json();
    if (!isValid(raw)) return json({ error: 'invalid_body' }, 400, hdrs);
    body = raw;
  } catch {
    return json({ error: 'invalid_body' }, 400, hdrs);
  }

  // FR-TRANSLATE-003 — reject unsupported targets before spending a provider call.
  if (!isSupportedTarget(body.targetLanguage)) {
    return json({ error: 'unsupported_language' }, 400, hdrs);
  }

  // §9 — verify the caller can SELECT the source row (RLS) AND read the field value
  // from it. We translate this DB value, never the client-supplied text, so a
  // malicious client cannot poison the cache shared by all readers of the row.
  const src = SOURCE[body.contentType];
  const column = src.fields[body.field];
  if (!column) return json({ error: 'invalid_body' }, 400, hdrs);
  const { data: srcRow, error: visErr } = await authed.userClient
    .from(src.table)
    .select(`${src.pk}, ${column}`)
    .eq(src.pk, body.contentId)
    .maybeSingle();
  if (visErr) return json({ error: 'internal' }, 500, hdrs);
  if (!srcRow) return json({ error: 'forbidden' }, 403, hdrs);
  const sourceText = (srcRow as unknown as Record<string, unknown>)[column];
  if (typeof sourceText !== 'string' || sourceText.trim().length === 0) {
    return json({ status: 'skipped' }, 200, hdrs);
  }
  if (sourceText.length > MAX_INPUT) {
    return json({ status: 'skipped' }, 200, hdrs);
  }

  // Short-circuit untranslatable input (emoji/url/number-only/empty).
  if (!isTranslatable(sourceText)) {
    return json({ status: 'skipped' }, 200, hdrs);
  }

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const key: CacheKey = {
    contentType: body.contentType,
    contentId: body.contentId,
    field: body.field,
    targetLanguage: body.targetLanguage,
  };

  // Cache hit → return inline, no LLM.
  const cached = await getCached(svc, key);
  if (cached) return json({ status: 'cached', translation: cached }, 200, hdrs);

  // Provider call (detect + translate folded, §8).
  let result;
  try {
    result = await selectProvider().translate({
      text: sourceText,
      targetLanguage: body.targetLanguage,
    });
  } catch (_e) {
    console.warn('[translate] provider failed', { contentType: body.contentType, field: body.field });
    return json({ error: 'provider_failed' }, 502, hdrs);
  }

  // Same-language no-op: store nothing, signal skipped.
  if (!needsTranslation(result.detectedSourceLanguage, body.targetLanguage)) {
    return json({ status: 'skipped' }, 200, hdrs);
  }

  const row = {
    ...key,
    sourceLanguage: result.detectedSourceLanguage,
    translatedText: result.translatedText,
    model: result.model,
    confidence: result.confidence,
  };
  const inserted = await putIfAbsent(svc, row); // single-flight (§7)
  const translation = inserted ? row : (await getCached(svc, key)) ?? row;
  return json({ status: inserted ? 'translated' : 'cached', translation }, 200, hdrs);
});
