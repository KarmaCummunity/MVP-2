import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { buildPostShareUrl, resolveShareBaseUrl, sharePost } from '../sharePost';

describe('buildPostShareUrl', () => {
  it('joins base URL and post id with a single slash, even when the base has a trailing slash', () => {
    expect(buildPostShareUrl('abc-123', 'https://example.com/p')).toBe('https://example.com/p/abc-123');
    expect(buildPostShareUrl('abc-123', 'https://example.com/p/')).toBe('https://example.com/p/abc-123');
    expect(buildPostShareUrl('abc-123', 'https://example.com/p///')).toBe('https://example.com/p/abc-123');
  });

  it('URL-encodes the post id so a stray "/" cannot escape the share path', () => {
    expect(buildPostShareUrl('a/b', 'https://example.com/p')).toBe('https://example.com/p/a%2Fb');
  });

  it('trims whitespace around the post id before encoding', () => {
    expect(buildPostShareUrl('  id-1  ', 'https://example.com/p')).toBe('https://example.com/p/id-1');
  });

  it('throws when the postId is empty/whitespace', () => {
    expect(() => buildPostShareUrl('', 'https://example.com/p')).toThrow();
    expect(() => buildPostShareUrl('   ', 'https://example.com/p')).toThrow();
  });

  it('throws when the share base URL is empty', () => {
    expect(() => buildPostShareUrl('abc', '')).toThrow();
    expect(() => buildPostShareUrl('abc', '   ')).toThrow();
  });
});

describe('resolveShareBaseUrl', () => {
  it('prefers EXPO_PUBLIC_SHARE_BASE_URL when set (custom domain swap)', () => {
    const base = resolveShareBaseUrl({
      EXPO_PUBLIC_SHARE_BASE_URL: 'https://share.example.com/p',
      EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    });
    expect(base).toBe('https://share.example.com/p');
  });

  it('strips trailing slashes from the override before returning', () => {
    const base = resolveShareBaseUrl({
      EXPO_PUBLIC_SHARE_BASE_URL: 'https://share.example.com/p///',
    });
    expect(base).toBe('https://share.example.com/p');
  });

  it('falls back to the supabase edge function URL when no override is set', () => {
    const base = resolveShareBaseUrl({
      EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    });
    expect(base).toBe('https://abc.supabase.co/functions/v1/share-post');
  });

  it('returns the static marketing fallback when both env vars are missing', () => {
    // FR-POST-023 — public URL must always be under our control even in
    // dev / test contexts where env vars are not wired up.
    const base = resolveShareBaseUrl({});
    expect(base).toBe('https://karma-community-kc.com/p');
  });

  it('treats empty/whitespace env values as unset', () => {
    const base = resolveShareBaseUrl({
      EXPO_PUBLIC_SHARE_BASE_URL: '   ',
      EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
    });
    expect(base).toBe('https://abc.supabase.co/functions/v1/share-post');
  });
});

// ---- sharePost (web) — tests stub `navigator.share` + `navigator.clipboard`. ----
// We pin Platform.OS=web through the resolve alias (react-native → react-native-web)
// already configured in vitest.config.ts.

type FakeNavigator = {
  share?: ReturnType<typeof vi.fn>;
  clipboard?: { writeText: ReturnType<typeof vi.fn> };
};

describe('sharePost (web path)', () => {
  const originalNavigator = (globalThis as { navigator?: unknown }).navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  function installNavigator(nav: FakeNavigator): void {
    // `globalThis.navigator` is a non-writable accessor in the vitest node
    // environment — assigning to it throws. `defineProperty` bypasses the
    // getter and gives each test a clean slate.
    Object.defineProperty(globalThis, 'navigator', {
      value: nav,
      configurable: true,
      writable: true,
    });
  }

  it('uses navigator.share when available and reports "shared"', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    installNavigator({ share });
    const outcome = await sharePost({
      postId: 'abc',
      title: 'Cool sofa',
      message: 'Cool sofa — קהילת קארמה',
      shareBaseUrl: 'https://share.example.com/p',
    });
    expect(outcome).toEqual({ kind: 'shared' });
    expect(share).toHaveBeenCalledWith({
      title: 'Cool sofa',
      text: 'Cool sofa — קהילת קארמה',
      url: 'https://share.example.com/p/abc',
    });
  });

  it('treats AbortError from navigator.share as a user dismissal', async () => {
    const abort = new Error('user dismissed');
    abort.name = 'AbortError';
    const share = vi.fn().mockRejectedValue(abort);
    const writeText = vi.fn().mockResolvedValue(undefined);
    installNavigator({ share, clipboard: { writeText } });
    const outcome = await sharePost({
      postId: 'abc',
      title: 'x',
      message: 'x',
      shareBaseUrl: 'https://example.com/p',
    });
    expect(outcome).toEqual({ kind: 'dismissed' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to clipboard.writeText when navigator.share rejects with a non-abort error', async () => {
    const share = vi.fn().mockRejectedValue(new Error('not allowed'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    installNavigator({ share, clipboard: { writeText } });
    const outcome = await sharePost({
      postId: 'abc',
      title: 'x',
      message: 'x',
      shareBaseUrl: 'https://example.com/p',
    });
    expect(outcome).toEqual({ kind: 'copied' });
    expect(writeText).toHaveBeenCalledWith('https://example.com/p/abc');
  });

  it('uses clipboard.writeText when navigator.share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    installNavigator({ clipboard: { writeText } });
    const outcome = await sharePost({
      postId: 'abc',
      title: 'x',
      message: 'x',
      shareBaseUrl: 'https://example.com/p',
    });
    expect(outcome).toEqual({ kind: 'copied' });
  });

  it('returns failed when neither share nor clipboard is available', async () => {
    installNavigator({});
    const outcome = await sharePost({
      postId: 'abc',
      title: 'x',
      message: 'x',
      shareBaseUrl: 'https://example.com/p',
    });
    expect(outcome.kind).toBe('failed');
  });
});
