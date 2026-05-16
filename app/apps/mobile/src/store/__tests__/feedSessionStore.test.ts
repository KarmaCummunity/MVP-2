import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFeedSessionStore } from '../feedSessionStore';

// The store is a module-level zustand singleton. Each test resets to the
// canonical initial state via setState to stay isolated.

const INITIAL = {
  newPostsCount: 0,
  firstPostNudgeDismissedThisSession: false,
  ephemeralToast: null,
};

beforeEach(() => {
  useFeedSessionStore.setState(INITIAL);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useFeedSessionStore — newPostsCount (FR-FEED-009)', () => {
  it('increments newPostsCount each call', () => {
    useFeedSessionStore.getState().incrementNewPosts();
    expect(useFeedSessionStore.getState().newPostsCount).toBe(1);
    useFeedSessionStore.getState().incrementNewPosts();
    useFeedSessionStore.getState().incrementNewPosts();
    expect(useFeedSessionStore.getState().newPostsCount).toBe(3);
  });

  it('resetNewPosts clears the counter back to 0', () => {
    useFeedSessionStore.getState().incrementNewPosts();
    useFeedSessionStore.getState().incrementNewPosts();
    useFeedSessionStore.getState().resetNewPosts();
    expect(useFeedSessionStore.getState().newPostsCount).toBe(0);
  });

  it('resetNewPosts on a fresh store is a no-op (no underflow)', () => {
    useFeedSessionStore.getState().resetNewPosts();
    expect(useFeedSessionStore.getState().newPostsCount).toBe(0);
  });
});

describe('useFeedSessionStore — first-post nudge (FR-FEED-015)', () => {
  it('starts not-dismissed; dismiss flips to true; is idempotent on re-dismiss', () => {
    expect(useFeedSessionStore.getState().firstPostNudgeDismissedThisSession).toBe(false);
    useFeedSessionStore.getState().dismissNudgeForSession();
    expect(useFeedSessionStore.getState().firstPostNudgeDismissedThisSession).toBe(true);
    useFeedSessionStore.getState().dismissNudgeForSession();
    expect(useFeedSessionStore.getState().firstPostNudgeDismissedThisSession).toBe(true);
  });
});

describe('useFeedSessionStore — ephemeralToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('showEphemeralToast sets the toast and clears it after the default 1500ms', () => {
    useFeedSessionStore.getState().showEphemeralToast('done', 'success');
    expect(useFeedSessionStore.getState().ephemeralToast).toEqual({ message: 'done', tone: 'success' });

    vi.advanceTimersByTime(1499);
    expect(useFeedSessionStore.getState().ephemeralToast).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(useFeedSessionStore.getState().ephemeralToast).toBeNull();
  });

  it('honours a custom durationMs', () => {
    useFeedSessionStore.getState().showEphemeralToast('wait', 'error', 5000);
    vi.advanceTimersByTime(4999);
    expect(useFeedSessionStore.getState().ephemeralToast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(useFeedSessionStore.getState().ephemeralToast).toBeNull();
  });

  it('a second showEphemeralToast cancels the prior timer and replaces the toast (no premature null)', () => {
    useFeedSessionStore.getState().showEphemeralToast('first', 'success');
    vi.advanceTimersByTime(1400);
    expect(useFeedSessionStore.getState().ephemeralToast?.message).toBe('first');

    useFeedSessionStore.getState().showEphemeralToast('second', 'error');
    // The 'first' timer's 100 remaining ms must NOT fire and clear 'second'.
    vi.advanceTimersByTime(100);
    expect(useFeedSessionStore.getState().ephemeralToast).toEqual({ message: 'second', tone: 'error' });

    // 'second' should clear at its own 1500ms (we've only advanced 100 of those).
    vi.advanceTimersByTime(1399);
    expect(useFeedSessionStore.getState().ephemeralToast).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(useFeedSessionStore.getState().ephemeralToast).toBeNull();
  });
});
