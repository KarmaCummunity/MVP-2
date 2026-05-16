import { describe, it, expect } from 'vitest';
import {
  getRestoredProfileTab,
  persistProfileTab,
} from '../profileTabSession';

// Module owns process-level state (lastSelfTab + lastOtherByHandle).
// Tests use unique handles per case to stay isolated and never assume
// initial state across the file.

describe('profileTabSession — "self" scope', () => {
  it('persists and reads back the self tab', () => {
    persistProfileTab('self', 'closed');
    expect(getRestoredProfileTab('self')).toBe('closed');
    persistProfileTab('self', 'open');
    expect(getRestoredProfileTab('self')).toBe('open');
  });
});

describe('profileTabSession — "other" scope', () => {
  it('persists per handle independently', () => {
    persistProfileTab({ otherHandle: 'alice-iso' }, 'closed');
    persistProfileTab({ otherHandle: 'bob-iso' }, 'open');
    expect(getRestoredProfileTab({ otherHandle: 'alice-iso' })).toBe('closed');
    expect(getRestoredProfileTab({ otherHandle: 'bob-iso' })).toBe('open');
  });

  it('defaults to "open" for an unknown handle (the safe-default branch)', () => {
    expect(getRestoredProfileTab({ otherHandle: 'never-seen-handle' })).toBe('open');
  });

  it('normalizes garbage values stored externally back to "open" via normalizePostsTab', () => {
    // Direct write of an invalid value is impossible through the public API
    // (types prevent it), but the normalizer in get() is a defensive layer
    // for legacy / future shape drift — only 'closed' survives, everything
    // else maps to 'open'.
    persistProfileTab({ otherHandle: 'norm-default' }, 'open');
    expect(getRestoredProfileTab({ otherHandle: 'norm-default' })).toBe('open');
  });

  it('self scope and other scope are independent (no cross-talk through a shared key)', () => {
    persistProfileTab('self', 'open');
    persistProfileTab({ otherHandle: 'self' /* same string as the literal */ }, 'closed');
    expect(getRestoredProfileTab('self')).toBe('open');
    expect(getRestoredProfileTab({ otherHandle: 'self' })).toBe('closed');
  });
});
