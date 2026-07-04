import { describe, it, expect, beforeEach } from 'vitest';

// The module is a browser IIFE that attaches helpers to window.GloweGuest and
// reads window.sessionStorage. Provide a minimal window before importing it.
const store = {};
globalThis.window = globalThis.window || {};
globalThis.window.sessionStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

await import('../glowe-guest.js');
const { buildJoinCopy, setPendingIntent, takePendingIntent } = globalThis.window.GloweGuest;

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

describe('pending intent', () => {
  beforeEach(() => { Object.keys(store).forEach((k) => delete store[k]); });

  it('round-trips and is consumed once', () => {
    setPendingIntent({ action: 'rsvp-event', targetUrl: 'pages/opportunity.html?id=7' });
    const first = takePendingIntent();
    expect(first).toEqual({ action: 'rsvp-event', targetUrl: 'pages/opportunity.html?id=7' });
    expect(takePendingIntent()).toBeNull();
  });

  it('returns null when nothing is stored', () => {
    expect(takePendingIntent()).toBeNull();
  });
});
