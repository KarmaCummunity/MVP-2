// ─────────────────────────────────────────────
// IAuthService — port for authentication providers.
// Mapped to SRS: FR-AUTH-003 (Google sign-up), FR-AUTH-006 (email sign-up),
// FR-AUTH-007 (sign-in, all paths), FR-AUTH-013 (cold-start restore), FR-AUTH-017 (sign-out).
// Adapter lives in @kc/infrastructure-supabase.
// docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md
// ─────────────────────────────────────────────

export interface AuthSession {
  readonly userId: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number; // unix seconds
  /**
   * FR-AUTH-003 AC5 (interim, pre-`Profile`-table). Populated by the Supabase
   * adapter from `user.user_metadata.full_name` / `name`. `null` for users who
   * signed up without an SSO that returned a name (e.g. email/password).
   */
  readonly displayName: string | null;
  /**
   * FR-AUTH-003 AC5 (interim, pre-`Profile`-table). Populated by the Supabase
   * adapter from `user.user_metadata.avatar_url` / `picture`.
   */
  readonly avatarUrl: string | null;
}

export interface IAuthService {
  /** Create a new credentialed user. Returns the active session, or null if email-confirmation is pending. */
  signUpWithEmail(email: string, password: string): Promise<AuthSession | null>;

  /** Authenticate an existing user. */
  signInWithEmail(email: string, password: string): Promise<AuthSession>;

  /** Invalidate the local session and revoke server-side tokens. */
  signOut(): Promise<void>;

  /** Restore the persisted session on cold-start. Returns null if no session or expired. */
  getCurrentSession(): Promise<AuthSession | null>;

  /** Subscribe to session changes (login, refresh, signout, server-side revoke). */
  onSessionChange(listener: (session: AuthSession | null) => void): () => void;

  /**
   * FR-AUTH-003 / FR-AUTH-007 (Google path): begin Google OAuth (PKCE). Returns the
   * provider URL the caller must open in a browser; the browser redirects to
   * `redirectTo` with `?code=...` once the user authorises.
   */
  getGoogleAuthUrl(redirectTo: string): Promise<string>;

  /**
   * FR-AUTH-003 / FR-AUTH-007 (Google path, completion): exchange the OAuth `code`
   * returned in the provider redirect for an authenticated session.
   */
  exchangeCodeForSession(code: string): Promise<AuthSession>;
}
