// ─────────────────────────────────────────────
// mapAuthError — translate a Supabase AuthError into the application
// `AuthError` taxonomy (`AuthErrorCode`). Extracted from `SupabaseAuthService`
// so the conditional branches can be exercised in isolation (TD-50).
//
// Callers in `SupabaseAuthService` may further collapse codes for security
// reasons (TD-69 / D-22 — e.g. credentialed sign-in failures rewrite to
// `authentication_failed`). This function returns the raw inferred code.
// ─────────────────────────────────────────────

import type { AuthError as SbAuthError } from '@supabase/supabase-js';
import { AuthError } from '@kc/application';

export function mapAuthError(err: SbAuthError): AuthError {
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
