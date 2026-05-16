import { describe, it, expect } from 'vitest';
import {
  consumePreferNewThread,
  markNeedFreshThreadWith,
} from '../chatNavigationPrefs';

// The module owns a module-level Set, so each test uses a unique counterpart
// id (with the test name baked in) to avoid cross-contamination. Vitest does
// not reset module state between tests in the same file.

describe('chatNavigationPrefs (FR-CHAT-016)', () => {
  it('returns false when no mark exists for the counterpart', () => {
    expect(consumePreferNewThread('user-no-mark')).toBe(false);
  });

  it('returns true once after marking, then false on subsequent reads (consume-once semantics)', () => {
    markNeedFreshThreadWith('user-consume-once');
    expect(consumePreferNewThread('user-consume-once')).toBe(true);
    expect(consumePreferNewThread('user-consume-once')).toBe(false);
    expect(consumePreferNewThread('user-consume-once')).toBe(false);
  });

  it('marks are independent per counterpart — consuming A does not affect B', () => {
    markNeedFreshThreadWith('user-A-iso');
    markNeedFreshThreadWith('user-B-iso');
    expect(consumePreferNewThread('user-A-iso')).toBe(true);
    // B is still marked; consuming A did not clear B.
    expect(consumePreferNewThread('user-B-iso')).toBe(true);
    expect(consumePreferNewThread('user-A-iso')).toBe(false);
    expect(consumePreferNewThread('user-B-iso')).toBe(false);
  });

  it('marking the same counterpart twice still consumes in a single read (Set semantics)', () => {
    markNeedFreshThreadWith('user-double-mark');
    markNeedFreshThreadWith('user-double-mark');
    expect(consumePreferNewThread('user-double-mark')).toBe(true);
    expect(consumePreferNewThread('user-double-mark')).toBe(false);
  });

  it('re-marking after consume re-arms the flag (each personal-inbox-hide sets it again)', () => {
    markNeedFreshThreadWith('user-rearm');
    expect(consumePreferNewThread('user-rearm')).toBe(true);
    expect(consumePreferNewThread('user-rearm')).toBe(false);
    markNeedFreshThreadWith('user-rearm');
    expect(consumePreferNewThread('user-rearm')).toBe(true);
    expect(consumePreferNewThread('user-rearm')).toBe(false);
  });

  it('an empty-string counterpart id is treated like any other key (not a no-op)', () => {
    markNeedFreshThreadWith('');
    expect(consumePreferNewThread('')).toBe(true);
    expect(consumePreferNewThread('')).toBe(false);
  });
});
