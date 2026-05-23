import { describe, it, expect, beforeEach } from 'vitest';

import {
  isRestorablePath,
  useRedirectIntentStore,
  REDIRECT_INTENT_TTL_MS,
} from '../redirectIntentStore';

describe('isRestorablePath', () => {
  it('accepts /post/, /user/, /chat/ deep links', () => {
    expect(isRestorablePath('/post/abc-123')).toBe(true);
    expect(isRestorablePath('/user/handle')).toBe(true);
    expect(isRestorablePath('/chat/xyz')).toBe(true);
  });

  it('rejects auth, onboarding, and (tabs) entry paths', () => {
    expect(isRestorablePath('/(auth)')).toBe(false);
    expect(isRestorablePath('/(onboarding)/about-intro')).toBe(false);
    expect(isRestorablePath('/(tabs)')).toBe(false);
    // Tabs landing — a stale capture must not bounce the user out of the auth flow.
    expect(isRestorablePath('/(tabs)/home')).toBe(false);
  });

  it('rejects empty / non-string input defensively', () => {
    expect(isRestorablePath('')).toBe(false);
    // @ts-expect-error — runtime guard tested intentionally
    expect(isRestorablePath(null)).toBe(false);
    // @ts-expect-error — runtime guard tested intentionally
    expect(isRestorablePath(undefined)).toBe(false);
  });
});

describe('useRedirectIntentStore', () => {
  beforeEach(() => {
    useRedirectIntentStore.getState().clearPath();
  });

  it('captures a restorable path and consumes it once', () => {
    useRedirectIntentStore.getState().capturePath('/post/abc');
    expect(useRedirectIntentStore.getState().pendingPath).toBe('/post/abc');
    const first = useRedirectIntentStore.getState().consumePath();
    expect(first).toBe('/post/abc');
    // Second consume returns null — the intent has been cleared.
    const second = useRedirectIntentStore.getState().consumePath();
    expect(second).toBeNull();
  });

  it('ignores attempts to capture non-restorable paths', () => {
    useRedirectIntentStore.getState().capturePath('/(tabs)/home');
    expect(useRedirectIntentStore.getState().pendingPath).toBeNull();
  });

  it('expires captures after the TTL', () => {
    const t0 = 1_000_000;
    useRedirectIntentStore.getState().capturePath('/post/abc', t0);
    expect(useRedirectIntentStore.getState().pendingPath).toBe('/post/abc');
    // Right at the boundary still restores.
    expect(useRedirectIntentStore.getState().consumePath(t0 + REDIRECT_INTENT_TTL_MS)).toBe('/post/abc');

    useRedirectIntentStore.getState().capturePath('/post/abc', t0);
    // Past the boundary returns null and clears the slot.
    expect(useRedirectIntentStore.getState().consumePath(t0 + REDIRECT_INTENT_TTL_MS + 1)).toBeNull();
    expect(useRedirectIntentStore.getState().pendingPath).toBeNull();
  });

  it('does not overwrite an existing capture with the same path (no-op)', () => {
    const t0 = 1_000_000;
    useRedirectIntentStore.getState().capturePath('/post/abc', t0);
    useRedirectIntentStore.getState().capturePath('/post/abc', t0 + 5);
    // capturedAtMs should remain t0 since the duplicate capture was a no-op.
    expect(useRedirectIntentStore.getState().capturedAtMs).toBe(t0);
  });
});
