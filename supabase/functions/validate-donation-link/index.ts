// Edge Function: validate-donation-link
// FR-DONATE-008. Validates URL reachability server-side, then inserts a row
// into donation_links using the service-role key. Direct INSERT from clients
// is blocked by RLS.
//
// POST { category_slug, url, display_name, description? }
// → 200 { ok: true, link }
// → 400 { ok: false, code: 'invalid_input' | 'invalid_url' | 'unreachable' }
// → 401 { ok: false, code: 'unauthorized' }
// → 429 { ok: false, code: 'rate_limited' }
// → 500 { ok: false, code: 'server_error' }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_SLUGS = new Set([
  'time', 'money', 'food', 'housing', 'transport', 'knowledge', 'animals', 'medical',
]);

const MAX_LINKS_PER_HOUR = 10;
const FETCH_TIMEOUT_MS = 5000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function parseUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

async function checkReachable(url: string): Promise<boolean> {
  // Try HEAD first; some hosts reject HEAD with 405 — fall back to GET.
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const resp = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        // Identify ourselves so hosts that block default fetch UA still respond.
        headers: { 'User-Agent': 'KarmaCommunityLinkValidator/1.0' },
      });
      if (resp.status >= 200 && resp.status < 400) return true;
      if (method === 'HEAD' && (resp.status === 405 || resp.status >= 400)) continue;
      return false;
    } catch {
      // Network error or timeout — try next method (or return false after the GET).
      if (method === 'GET') return false;
    }
  }
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, code: 'invalid_input' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ ok: false, code: 'unauthorized' }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ ok: false, code: 'unauthorized' }, 401);
  }
  const userId = userData.user.id;

  let body: { category_slug?: string; url?: string; display_name?: string; description?: string | null };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, code: 'invalid_input' }, 400);
  }

  const slug = body.category_slug;
  const displayName = (body.display_name ?? '').trim();
  const description = body.description == null ? null : String(body.description).trim();

  if (!slug || !ALLOWED_SLUGS.has(slug)) return jsonResponse({ ok: false, code: 'invalid_input' }, 400);
  if (displayName.length < 2 || displayName.length > 80) return jsonResponse({ ok: false, code: 'invalid_input' }, 400);
  if (description !== null && description.length > 280) return jsonResponse({ ok: false, code: 'invalid_input' }, 400);

  const parsed = parseUrl(body.url);
  if (!parsed) return jsonResponse({ ok: false, code: 'invalid_url' }, 400);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Soft rate-limit: count rows by this user in the past hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await adminClient
    .from('donation_links')
    .select('*', { count: 'exact', head: true })
    .eq('submitted_by', userId)
    .gte('created_at', oneHourAgo);
  if (countErr) {
    return jsonResponse({ ok: false, code: 'server_error' }, 500);
  }
  if ((count ?? 0) >= MAX_LINKS_PER_HOUR) {
    return jsonResponse({ ok: false, code: 'rate_limited' }, 429);
  }

  const reachable = await checkReachable(parsed.toString());
  if (!reachable) {
    return jsonResponse({ ok: false, code: 'unreachable' }, 400);
  }

  const { data: inserted, error: insertErr } = await adminClient
    .from('donation_links')
    .insert({
      category_slug: slug,
      url: parsed.toString(),
      display_name: displayName,
      description: description && description.length > 0 ? description : null,
      submitted_by: userId,
      validated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertErr || !inserted) {
    return jsonResponse({ ok: false, code: 'server_error' }, 500);
  }

  return jsonResponse({ ok: true, link: inserted }, 200);
});
