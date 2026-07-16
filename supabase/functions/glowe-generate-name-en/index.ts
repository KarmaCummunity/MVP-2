// supabase/functions/glowe-generate-name-en/index.ts — FR-GLOWE-024.
//
// Authenticated-only: generate an English/Latin display name (transliteration
// or natural English form) for person/organization names that are not already
// Latin-script. Failures return empty results so callers keep the source name.
//
// POST { names: [{ field, text, context: 'person'|'organization' }] }
//   → 200 { results: [{ field, textEn }] }
//   → 400 { error:'invalid_body' }  401 { error:'unauthorized' }
//   → 405 { error:'method_not_allowed' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { selectProvider } from '../_shared/translation/provider.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const MAX_NAMES = 4;
const MAX_INPUT = 120;

// Non-Latin letter scripts that need an English variant (Hebrew, Arabic,
// Cyrillic, Greek, CJK). Pure Latin / digits / punctuation → copy as-is.
const NON_LATIN = /[\u0590-\u05FF\u0600-\u06FF\u0400-\u04FF\u0370-\u03FF\u4E00-\u9FFF]/;

function isPrimarilyLatin(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return !NON_LATIN.test(t);
}

function json(body: unknown, status: number, h: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...h },
  });
}

interface NameItem {
  field: string;
  text: string;
  context: 'person' | 'organization';
}

interface Body {
  names: NameItem[];
}

function isValid(b: unknown): b is Body {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (!Array.isArray(o.names) || o.names.length === 0 || o.names.length > MAX_NAMES) return false;
  return o.names.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const n = item as Record<string, unknown>;
    if (typeof n.field !== 'string' || !n.field) return false;
    if (typeof n.text !== 'string' || !n.text.trim() || n.text.length > MAX_INPUT) return false;
    if (n.context !== 'person' && n.context !== 'organization') return false;
    return true;
  });
}

async function getAuthedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

async function generateOne(text: string, context: 'person' | 'organization'): Promise<string> {
  if (isPrimarilyLatin(text)) return text.trim();
  const kind = context === 'organization' ? 'organization name' : 'person display name';
  const result = await selectProvider().translate({
    text: `Produce a natural English ${kind} (transliteration is fine). ` +
      `Do not add titles, honorifics, or explanation. Return only the name.\n\n${text.trim()}`,
    targetLanguage: 'en',
  });
  const out = (result.translatedText || '').trim().slice(0, MAX_INPUT);
  return out || text.trim();
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

  const userId = await getAuthedUserId(req);
  if (!userId) return json({ error: 'unauthorized' }, 401, hdrs);

  let body: Body;
  try {
    const raw = await req.json();
    if (!isValid(raw)) return json({ error: 'invalid_body' }, 400, hdrs);
    body = raw;
  } catch {
    return json({ error: 'invalid_body' }, 400, hdrs);
  }

  const results: { field: string; textEn: string }[] = [];
  for (const item of body.names) {
    try {
      const textEn = await generateOne(item.text, item.context);
      results.push({ field: item.field, textEn });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.warn('[glowe-generate-name-en] provider failed', { field: item.field, detail });
      // Graceful: empty English → caller keeps the source name.
      results.push({ field: item.field, textEn: '' });
    }
  }

  return json({ results }, 200, hdrs);
});
