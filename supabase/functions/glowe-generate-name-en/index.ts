// supabase/functions/glowe-generate-name-en/index.ts — FR-GLOWE-024.
//
// Generate English/Latin display names for GloWe person/org names.
//
// Mode A (authenticated write helpers — onboarding / edit):
//   POST { names: [{ field, text, context: 'person'|'organization' }] }
//   → 200 { results: [{ field, textEn }] }
//
// Mode B (anon-friendly lazy materialization for public profiles):
//   POST { profileIds: string[] }
//   → 200 { profiles: [{ id, displayNameEn?, orgNameEn? }] }
//   Reads source names server-side, fills missing *_en columns via service role,
//   so EN readers of existing Hebrew orgs get a Latin name without an edit cycle.
//
//   → 400 { error:'invalid_body' }  401 { error:'unauthorized' } (mode A only)
//   → 405 { error:'method_not_allowed' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, isAllowedOrigin } from '../_shared/cors.ts';
import { selectProvider } from '../_shared/translation/provider.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAX_NAMES = 4;
const MAX_PROFILES = 20;
const MAX_INPUT = 120;

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

type Body =
  | { mode: 'names'; names: NameItem[] }
  | { mode: 'profiles'; profileIds: string[] };

function parseBody(raw: unknown): Body | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  if (Array.isArray(o.profileIds)) {
    const ids = o.profileIds.filter((id): id is string => typeof id === 'string' && !!id);
    if (ids.length === 0 || ids.length > MAX_PROFILES) return null;
    return { mode: 'profiles', profileIds: [...new Set(ids)] };
  }

  if (!Array.isArray(o.names) || o.names.length === 0 || o.names.length > MAX_NAMES) return null;
  const names: NameItem[] = [];
  for (const item of o.names) {
    if (!item || typeof item !== 'object') return null;
    const n = item as Record<string, unknown>;
    if (typeof n.field !== 'string' || !n.field) return null;
    if (typeof n.text !== 'string' || !n.text.trim() || n.text.length > MAX_INPUT) return null;
    if (n.context !== 'person' && n.context !== 'organization') return null;
    names.push({ field: n.field, text: n.text, context: n.context });
  }
  return { mode: 'names', names };
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
  const source = text.trim();
  if (!source) return '';
  if (isPrimarilyLatin(source)) return source;
  const kind = context === 'organization' ? 'organization / brand name' : 'person display name';
  const result = await selectProvider().translate({
    text: source,
    targetLanguage: 'en',
    sourceHint:
      `This is a proper ${kind}. Transliterate into Latin letters so it stays recognizable ` +
      `(example: יד תומכת → Yad Tomechet). Do NOT translate the meaning into English words. ` +
      `Return only the name — no titles, quotes, or explanation.`,
  });
  const out = (result.translatedText || '').trim().slice(0, MAX_INPUT);
  // Reject if the provider echoed the non-Latin source unchanged.
  if (!out || (!isPrimarilyLatin(out) && out === source)) return '';
  return out;
}

async function handleNames(names: NameItem[]): Promise<{ field: string; textEn: string }[]> {
  const results: { field: string; textEn: string }[] = [];
  for (const item of names) {
    try {
      results.push({ field: item.field, textEn: await generateOne(item.text, item.context) });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.warn('[glowe-generate-name-en] provider failed', { field: item.field, detail });
      results.push({ field: item.field, textEn: '' });
    }
  }
  return results;
}

async function handleProfiles(profileIds: string[]): Promise<{
  id: string;
  displayNameEn?: string;
  orgNameEn?: string;
}[]> {
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: rows, error } = await svc
    .from('glowe_profiles')
    .select('id, display_name, display_name_en, org_name, org_name_en, account_type')
    .in('id', profileIds);
  if (error) throw new Error(error.message);

  const out: { id: string; displayNameEn?: string; orgNameEn?: string }[] = [];
  for (const row of rows || []) {
    const patch: Record<string, string> = {};
    let displayNameEn = typeof row.display_name_en === 'string' ? row.display_name_en.trim() : '';
    let orgNameEn = typeof row.org_name_en === 'string' ? row.org_name_en.trim() : '';

    if (!displayNameEn && typeof row.display_name === 'string' && row.display_name.trim()) {
      try {
        displayNameEn = await generateOne(row.display_name, 'person');
        if (displayNameEn) patch.display_name_en = displayNameEn;
      } catch (e) {
        console.warn('[glowe-generate-name-en] display_name failed', {
          id: row.id,
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (
      row.account_type === 'organization'
      && !orgNameEn
      && typeof row.org_name === 'string'
      && row.org_name.trim()
    ) {
      try {
        orgNameEn = await generateOne(row.org_name, 'organization');
        if (orgNameEn) patch.org_name_en = orgNameEn;
      } catch (e) {
        console.warn('[glowe-generate-name-en] org_name failed', {
          id: row.id,
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await svc.from('glowe_profiles').update(patch).eq('id', row.id);
      if (upErr) {
        console.warn('[glowe-generate-name-en] persist failed', { id: row.id, detail: upErr.message });
      }
    }

    const entry: { id: string; displayNameEn?: string; orgNameEn?: string } = { id: row.id };
    if (displayNameEn) entry.displayNameEn = displayNameEn;
    if (orgNameEn) entry.orgNameEn = orgNameEn;
    out.push(entry);
  }
  return out;
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
    const parsed = parseBody(await req.json());
    if (!parsed) return json({ error: 'invalid_body' }, 400, hdrs);
    body = parsed;
  } catch {
    return json({ error: 'invalid_body' }, 400, hdrs);
  }

  if (body.mode === 'names') {
    const userId = await getAuthedUserId(req);
    if (!userId) return json({ error: 'unauthorized' }, 401, hdrs);
    const results = await handleNames(body.names);
    return json({ results }, 200, hdrs);
  }

  // Mode B — public profile materialization (anon OK).
  if (!SERVICE_ROLE_KEY) return json({ error: 'internal' }, 500, hdrs);
  try {
    const profiles = await handleProfiles(body.profileIds);
    return json({ profiles }, 200, hdrs);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.warn('[glowe-generate-name-en] profiles failed', { detail });
    return json({ error: 'internal' }, 500, hdrs);
  }
});
