// supabase/functions/glowe-translate/index.ts — FR-TRANSLATE-005.
//
// Demand-driven, single-target translation of one GLOWE content field. Anon is
// allowed (GLOWE serves anonymous readers). Anti-poisoning: the text is READ
// FROM THE SOURCE ROW with the service-role client, never from the request body,
// so a client cannot poison the shared cache. All GLOWE source tables are
// anon-public ("glowe public read"), so no per-user visibility check is required.
//
// POST { contentType, contentId, field, targetLanguage }
//   → 200 { status:'translated'|'cached'|'skipped', translation?: {...} }
//   → 400 { error:'invalid_body' | 'unsupported_language' }
//   → 405 { error:'method_not_allowed' }
//   → 502 { error:'provider_failed' }   500 { error:'internal' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { isTranslatable, needsTranslation } from '../_shared/translation/shortcircuit.ts';
import { selectProvider } from '../_shared/translation/provider.ts';
import { isSupportedTarget } from '../_shared/translation/supportedLanguages.ts';
import { getCached, putIfAbsent, type CacheKey } from './cache.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAX_INPUT = 5000;

// content_type → source table + PK column + { field: db column }. The text we
// translate is READ FROM THIS ROW (not client-supplied). Names (author_name,
// organization, display_name) are deliberately absent — never translated.
const SOURCE: Record<string, { table: string; pk: string; fields: Record<string, string> }> = {
  glowe_post: { table: 'glowe_posts', pk: 'id', fields: { title: 'title', text: 'text' } },
  glowe_opportunity: {
    table: 'glowe_opportunities', pk: 'id',
    fields: { title: 'title', description: 'description' },
  },
  glowe_project: {
    table: 'glowe_projects', pk: 'id',
    fields: { title: 'title', description: 'description' },
  },
  glowe_profile: {
    table: 'glowe_profiles', pk: 'id',
    fields: {
      about: 'about', focus: 'focus', needs: 'needs',
      org_description: 'org_description', org_field: 'org_field',
    },
  },
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
}

function isValid(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  const src = typeof o.contentType === 'string' ? SOURCE[o.contentType] : undefined;
  if (!src) return false;
  if (typeof o.contentId !== 'string' || !o.contentId) return false;
  if (typeof o.field !== 'string' || !src.fields[o.field]) return false;
  if (typeof o.targetLanguage !== 'string' || !o.targetLanguage) return false;
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

  let body: Body;
  try {
    const raw = await req.json();
    if (!isValid(raw)) return json({ error: 'invalid_body' }, 400, hdrs);
    body = raw;
  } catch {
    return json({ error: 'invalid_body' }, 400, hdrs);
  }
  if (!isSupportedTarget(body.targetLanguage)) {
    return json({ error: 'unsupported_language' }, 400, hdrs);
  }

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const src = SOURCE[body.contentType];
  const column = src.fields[body.field];

  // Anti-poisoning: read the source text from the row, never from the client.
  const { data: srcRow, error: readErr } = await svc
    .from(src.table)
    .select(`${src.pk}, ${column}`)
    .eq(src.pk, body.contentId)
    .maybeSingle();
  if (readErr) return json({ error: 'internal' }, 500, hdrs);
  if (!srcRow) return json({ status: 'skipped' }, 200, hdrs);
  const sourceText = (srcRow as Record<string, unknown>)[column];
  if (typeof sourceText !== 'string' || sourceText.trim().length === 0) {
    return json({ status: 'skipped' }, 200, hdrs);
  }
  if (sourceText.length > MAX_INPUT || !isTranslatable(sourceText)) {
    return json({ status: 'skipped' }, 200, hdrs);
  }

  const key: CacheKey = {
    contentType: body.contentType,
    contentId: body.contentId,
    field: body.field,
    targetLanguage: body.targetLanguage,
  };

  const cached = await getCached(svc, key);
  if (cached) return json({ status: 'cached', translation: cached }, 200, hdrs);

  let result;
  try {
    result = await selectProvider().translate({
      text: sourceText,
      targetLanguage: body.targetLanguage,
    });
  } catch (e) {
    // Full upstream detail (e.g. Gemini quota/429 body) goes to the server log
    // only; the client response stays generic so quota internals aren't exposed.
    const detail = e instanceof Error ? e.message : String(e);
    console.warn('[glowe-translate] provider failed', {
      contentType: body.contentType,
      field: body.field,
      detail,
    });
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
  const inserted = await putIfAbsent(svc, row); // single-flight
  const translation = inserted ? row : (await getCached(svc, key)) ?? row;
  return json({ status: inserted ? 'translated' : 'cached', translation }, 200, hdrs);
});
