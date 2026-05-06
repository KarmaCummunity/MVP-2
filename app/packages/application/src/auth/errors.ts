// ─────────────────────────────────────────────
// Auth domain errors
// Mapped to SRS: FR-AUTH-006, FR-AUTH-007, FR-AUTH-013, FR-AUTH-017
// ─────────────────────────────────────────────

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_already_in_use'
  | 'weak_password'
  | 'invalid_email'
  | 'email_not_verified'
  | 'session_expired'
  | 'rate_limited'
  | 'cooldown_active'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly cause?: unknown;

  constructor(code: AuthErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.cause = cause;
  }
}

export function isAuthError(value: unknown): value is AuthError {
  return value instanceof AuthError;
}
