// ─────────────────────────────────────────────
// IAuthService — port for authentication providers.
// Mapped to SRS: FR-AUTH-003 (Google sign-up), FR-AUTH-006 (email sign-up),
// FR-AUTH-007 (sign-in, all paths), FR-AUTH-013 (cold-start restore), FR-AUTH-017 (sign-out).
// Adapter lives in @kc/infrastructure-supabase.
// docs/SSOT/spec/01_auth_and_onboarding.md
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
  /**
   * Create a new credentialed user. Returns the active session, or null if
   * email-confirmation is pending. Pass `emailRedirectTo` to set the URL
   * Supabase places into `{{ .ConfirmationURL }}` in the verification email.
   */
  signUpWithEmail(
    email: string,
    password: string,
    options?: { emailRedirectTo?: string },
  ): Promise<AuthSession | null>;

  signInWithEmail(email: string, password: string): Promise<AuthSession>;

  signOut(): Promise<void>;

  getCurrentSession(): Promise<AuthSession | null>;

  onSessionChange(listener: (session: AuthSession | null) => void): () => void;

  getGoogleAuthUrl(redirectTo: string): Promise<string>;

  exchangeCodeForSession(code: string): Promise<AuthSession>;

  /**
   * FR-AUTH-006 (MVP gate): resend the signup verification email to `email`.
   * `emailRedirectTo` controls where the link lands after Supabase verifies the
   * token. Throws AuthError('rate_limited', ...) on too-frequent calls.
   */
  resendVerificationEmail(
    email: string,
    options?: { emailRedirectTo?: string },
  ): Promise<void>;

  /**
   * FR-AUTH-006 (MVP gate): exchange a verification token (from the email
   * link) for an authenticated session.
   */
  verifyEmail(tokenHash: string): Promise<AuthSession>;
}
