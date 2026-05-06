// ─────────────────────────────────────────────
// IAuthService — port for authentication providers.
// Mapped to SRS: FR-AUTH-006, FR-AUTH-007, FR-AUTH-013, FR-AUTH-017
// Adapter lives in @kc/infrastructure-supabase.
// ─────────────────────────────────────────────

export interface AuthSession {
  readonly userId: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number; // unix seconds
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
}
