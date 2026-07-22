import { describe, it, expect } from 'vitest';
import { buildJoinCopy, GUEST_JOIN_COPY } from '../guestGate';

describe('GUEST_JOIN_COPY', () => {
  it('defines copy for every guest action key', () => {
    const keys = Object.keys(GUEST_JOIN_COPY);
    expect(keys).toContain('create-need');
    expect(keys).toContain('offer-help');
    expect(keys.length).toBeGreaterThanOrEqual(13);
  });
});

describe('buildJoinCopy', () => {
  it('interpolates context for a known action', () => {
    const copy = buildJoinCopy('offer-help', { org: 'Green Roots' });
    expect(copy.title).toBeTruthy();
    expect(copy.body).toContain('Green Roots');
  });

  it('falls back to generic copy for an unknown action', () => {
    const copy = buildJoinCopy('no-such-action', {});
    expect(copy.title).toBeTruthy();
    expect(copy.body).toBeTruthy();
    expect(copy.body).not.toContain('undefined');
  });

  it('omits the placeholder cleanly when context is missing', () => {
    const copy = buildJoinCopy('offer-help', {});
    expect(copy.body).not.toContain('{org}');
    expect(copy.body).not.toContain('undefined');
  });
});
