/**
 * Build a Supabase auth session via REST (grant_type=password) for Playwright injection.
 * Skips the /sign-in UI — used when email/password login is not product-tested (D-55 / option 3).
 */

export interface InjectedSupabaseSession {
  storageKey: string;
  session: Record<string, unknown>;
}

function projectRefFromSupabaseUrl(supabaseUrl: string): string {
  const host = new URL(supabaseUrl.replace(/\/$/, '')).hostname;
  const ref = host.split('.')[0];
  if (!ref) throw new Error(`Cannot parse Supabase project ref from URL: ${supabaseUrl}`);
  return ref;
}

export async function fetchPasswordSession(params: {
  supabaseUrl: string;
  anonKey: string;
  email: string;
  password: string;
}): Promise<InjectedSupabaseSession> {
  const base = params.supabaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: params.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: params.email, password: params.password }),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const detail =
      (body.error_description as string | undefined) ??
      (body.msg as string | undefined) ??
      (body.error as string | undefined) ??
      `HTTP ${res.status}`;
    throw new Error(`E2E Supabase sign-in failed: ${detail}`);
  }

  const accessToken = body.access_token as string | undefined;
  if (!accessToken) throw new Error('E2E Supabase sign-in: missing access_token');

  const expiresIn = (body.expires_in as number | undefined) ?? 3600;
  const expiresAt =
    (body.expires_at as number | undefined) ??
    Math.floor(Date.now() / 1000) + expiresIn;

  const storageKey = `sb-${projectRefFromSupabaseUrl(base)}-auth-token`;
  const session = {
    access_token: accessToken,
    refresh_token: body.refresh_token,
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: (body.token_type as string | undefined) ?? 'bearer',
    user: body.user,
  };

  return { storageKey, session };
}
