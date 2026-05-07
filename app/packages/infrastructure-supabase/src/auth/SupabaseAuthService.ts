// ─────────────────────────────────────────────
// SupabaseAuthService — adapter for IAuthService backed by @supabase/supabase-js.
// Mapped to SRS: FR-AUTH-003 (Google sign-up), FR-AUTH-006 (email sign-up),
// FR-AUTH-007 (sign-in, all paths), FR-AUTH-013 (cold-start restore), FR-AUTH-017 (sign-out).
// docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md
// ─────────────────────────────────────────────

import type { SupabaseClient, AuthError as SbAuthError, Session as SbSession } from '@supabase/supabase-js';
import { AuthError, type AuthSession, type IAuthService } from '@kc/application';

export class SupabaseAuthService implements IAuthService {
  constructor(private readonly client: SupabaseClient) {}

  async signUpWithEmail(email: string, password: string): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw mapAuthError(error);
    return data.session ? toSession(data.session) : null;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw mapAuthError(error);
    if (!data.session) {
      throw new AuthError('unknown', 'sign_in_no_session');
    }
    return toSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw mapAuthError(error);
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw mapAuthError(error);
    return data.session ? toSession(data.session) : null;
  }

  onSessionChange(listener: (session: AuthSession | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(session ? toSession(session) : null);
    });
    return () => data.subscription.unsubscribe();
  }

  async getGoogleAuthUrl(redirectTo: string): Promise<string> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw mapAuthError(error);
    if (!data.url) throw new AuthError('unknown', 'oauth_no_url');
    return data.url;
  }

  async exchangeCodeForSession(code: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) throw mapAuthError(error);
    if (!data.session) throw new AuthError('unknown', 'oauth_no_session');
    return toSession(data.session);
  }
}

function toSession(s: SbSession): AuthSession {
  return {
    userId: s.user.id,
    email: s.user.email ?? null,
    emailVerified: Boolean(s.user.email_confirmed_at),
    accessToken: s.access_token,
    refreshToken: s.refresh_token,
    expiresAt: s.expires_at ?? Math.floor(Date.now() / 1000) + (s.expires_in ?? 3600),
  };
}

function mapAuthError(err: SbAuthError): AuthError {
  const status = err.status;
  const msg = (err.message || '').toLowerCase();

  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return new AuthError('invalid_credentials', err.message, err);
  }
  if (msg.includes('already registered') || msg.includes('already in use') || status === 422) {
    return new AuthError('email_already_in_use', err.message, err);
  }
  if (msg.includes('email not confirmed')) {
    return new AuthError('email_not_verified', err.message, err);
  }
  if (msg.includes('rate limit') || status === 429) {
    return new AuthError('rate_limited', err.message, err);
  }
  if (msg.includes('network')) {
    return new AuthError('network', err.message, err);
  }
  if (status === 401 || status === 403) {
    return new AuthError('session_expired', err.message, err);
  }
  return new AuthError('unknown', err.message, err);
}
