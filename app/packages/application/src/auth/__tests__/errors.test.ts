import { describe, it, expect } from 'vitest';
import {
  AuthError,
  DeleteAccountError,
  OnboardingError,
  ProfileError,
  isAuthError,
  isDeleteAccountError,
  isOnboardingError,
  isProfileError,
} from '../errors';

describe('AuthError', () => {
  it('is an Error subclass with name="AuthError", carries code + message + cause', () => {
    const cause = new Error('underlying');
    const err = new AuthError('invalid_credentials', 'Bad credentials', cause);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AuthError);
    expect(err.name).toBe('AuthError');
    expect(err.code).toBe('invalid_credentials');
    expect(err.message).toBe('Bad credentials');
    expect(err.cause).toBe(cause);
  });

  it('cause defaults to undefined when not supplied', () => {
    expect(new AuthError('rate_limited', 'rate-limited').cause).toBeUndefined();
  });

  it('preserves the code property across the AuthErrorCode union (sampling)', () => {
    for (const code of [
      'invalid_credentials', 'email_already_in_use', 'email_not_verified',
      'session_expired', 'rate_limited', 'cooldown_active', 'network', 'unknown',
    ] as const) {
      expect(new AuthError(code, code).code).toBe(code);
    }
  });
});

describe('isAuthError', () => {
  it('returns true for an AuthError instance', () => {
    expect(isAuthError(new AuthError('network', ''))).toBe(true);
  });

  it('returns false for a raw Error / non-AuthError / non-Error values', () => {
    expect(isAuthError(new Error('plain'))).toBe(false);
    expect(isAuthError(new DeleteAccountError('network', ''))).toBe(false);
    expect(isAuthError('string')).toBe(false);
    expect(isAuthError(null)).toBe(false);
    expect(isAuthError(undefined)).toBe(false);
    expect(isAuthError({ code: 'network', message: 'duck' })).toBe(false);
  });
});

describe('DeleteAccountError', () => {
  it('is an instanceof DeleteAccountError AND Error (Object.setPrototypeOf preserves the chain across transpilation)', () => {
    const err = new DeleteAccountError('suspended', 'Account suspended');
    expect(err).toBeInstanceOf(DeleteAccountError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('DeleteAccountError');
    expect(err.code).toBe('suspended');
  });

  it('isDeleteAccountError narrows correctly', () => {
    expect(isDeleteAccountError(new DeleteAccountError('network', ''))).toBe(true);
    expect(isDeleteAccountError(new AuthError('network', ''))).toBe(false);
    expect(isDeleteAccountError(new Error('plain'))).toBe(false);
  });
});

describe('OnboardingError', () => {
  it('carries the illegal_transition code; instanceof checks pass via setPrototypeOf', () => {
    const err = new OnboardingError('illegal_transition', 'pending_basic_info → completed');
    expect(err).toBeInstanceOf(OnboardingError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('illegal_transition');
  });

  it('isOnboardingError narrows correctly', () => {
    expect(isOnboardingError(new OnboardingError('illegal_transition', ''))).toBe(true);
    expect(isOnboardingError(new AuthError('network', ''))).toBe(false);
  });
});

describe('ProfileError', () => {
  it('message defaults to the code when not supplied (audit-2026-05-10 §3.6 — no more raw Error("code") throws)', () => {
    const err = new ProfileError('invalid_display_name');
    expect(err.message).toBe('invalid_display_name');
    expect(err.code).toBe('invalid_display_name');
    expect(err.name).toBe('ProfileError');
  });

  it('explicit message wins over the code default', () => {
    const err = new ProfileError('biography_too_long', 'Bio must be ≤ 200 chars');
    expect(err.message).toBe('Bio must be ≤ 200 chars');
    expect(err.code).toBe('biography_too_long');
  });

  it('carries the cause when supplied (e.g. wrapping a domain ValidationError)', () => {
    const inner = new Error('inner');
    const err = new ProfileError('biography_url_forbidden', undefined, inner);
    expect(err.cause).toBe(inner);
  });

  it('isProfileError narrows correctly', () => {
    expect(isProfileError(new ProfileError('empty_patch'))).toBe(true);
    expect(isProfileError(new AuthError('network', ''))).toBe(false);
    expect(isProfileError(new Error('plain'))).toBe(false);
  });
});

describe('cross-class isolation (type guards do not cross-contaminate)', () => {
  it('each type guard rejects instances of every other error class', () => {
    const a = new AuthError('network', '');
    const d = new DeleteAccountError('network', '');
    const o = new OnboardingError('illegal_transition', '');
    const p = new ProfileError('empty_patch');
    expect([isAuthError(d), isAuthError(o), isAuthError(p)]).toEqual([false, false, false]);
    expect([isDeleteAccountError(a), isDeleteAccountError(o), isDeleteAccountError(p)]).toEqual([false, false, false]);
    expect([isOnboardingError(a), isOnboardingError(d), isOnboardingError(p)]).toEqual([false, false, false]);
    expect([isProfileError(a), isProfileError(d), isProfileError(o)]).toEqual([false, false, false]);
  });
});
