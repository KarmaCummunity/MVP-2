import { describe, it, expect } from 'vitest';
import { AuthError as SbAuthError } from '@supabase/supabase-js';
import { mapAuthError } from '../mapAuthError';

/** Build a Supabase-shaped AuthError for the unit. The real SDK's class needs
 *  a message + status; for unit tests we only consume `.message` + `.status`. */
function fakeSbError(message: string, status?: number): SbAuthError {
  const e = new Error(message) as unknown as SbAuthError;
  Object.assign(e, { name: 'AuthApiError', status });
  return e;
}

describe('mapAuthError (TD-50)', () => {
  it('maps "Invalid login credentials" → invalid_credentials', () => {
    const out = mapAuthError(fakeSbError('Invalid login credentials', 400));
    expect(out.code).toBe('invalid_credentials');
    expect(out.message).toBe('Invalid login credentials');
  });

  it('maps "invalid credentials" (lowercase variant) → invalid_credentials', () => {
    expect(mapAuthError(fakeSbError('invalid credentials')).code).toBe('invalid_credentials');
  });

  it('maps "User already registered" → email_already_in_use', () => {
    expect(mapAuthError(fakeSbError('User already registered', 400)).code).toBe('email_already_in_use');
  });

  it('maps "already in use" → email_already_in_use', () => {
    expect(mapAuthError(fakeSbError('Email already in use')).code).toBe('email_already_in_use');
  });

  it('maps HTTP 422 → email_already_in_use (Supabase signup duplicate signal)', () => {
    expect(mapAuthError(fakeSbError('signup duplicate', 422)).code).toBe('email_already_in_use');
  });

  it('maps "Email not confirmed" → email_not_verified', () => {
    expect(mapAuthError(fakeSbError('Email not confirmed', 400)).code).toBe('email_not_verified');
  });

  it('maps "rate limit exceeded" → rate_limited', () => {
    expect(mapAuthError(fakeSbError('Rate limit exceeded')).code).toBe('rate_limited');
  });

  it('maps HTTP 429 → rate_limited', () => {
    expect(mapAuthError(fakeSbError('too many requests', 429)).code).toBe('rate_limited');
  });

  it('maps network message → network', () => {
    expect(mapAuthError(fakeSbError('network failure')).code).toBe('network');
  });

  it('maps HTTP 401 → session_expired', () => {
    expect(mapAuthError(fakeSbError('unauthorized', 401)).code).toBe('session_expired');
  });

  it('maps HTTP 403 → session_expired', () => {
    expect(mapAuthError(fakeSbError('forbidden', 403)).code).toBe('session_expired');
  });

  it('falls through to unknown for unrecognized errors', () => {
    expect(mapAuthError(fakeSbError('something unexpected', 500)).code).toBe('unknown');
  });

  it('handles empty message defensively', () => {
    expect(mapAuthError(fakeSbError('')).code).toBe('unknown');
  });

  it('precedence: message match wins over status (invalid login at 422 stays invalid_credentials)', () => {
    // Sanity that the first matching branch wins — protects against future
    // re-ordering bugs.
    const out = mapAuthError(fakeSbError('Invalid login credentials', 422));
    expect(out.code).toBe('invalid_credentials');
  });
});
