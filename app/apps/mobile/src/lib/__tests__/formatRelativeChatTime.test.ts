import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Echo-style i18n mock: returns the lookup key + interpolated `count` so we
// can assert both that the right bucket was hit (key) and the count passed in.
vi.mock('../../i18n', () => ({
  default: {
    t: (key: string, params?: Record<string, unknown>) =>
      params?.count !== undefined ? `[t:${key}|count=${params.count}]` : `[t:${key}]`,
  },
}));

import { formatRelativeChatTime } from '../formatRelativeChatTime';

// Anchor "now" so the bucket math is deterministic across runs.
const NOW = new Date('2026-05-16T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function isoMinutesAgo(min: number): string {
  return new Date(NOW.getTime() - min * 60_000).toISOString();
}

describe('formatRelativeChatTime — degenerate inputs', () => {
  it('returns "" for null', () => {
    expect(formatRelativeChatTime(null)).toBe('');
  });

  it('returns "" for undefined', () => {
    expect(formatRelativeChatTime(undefined)).toBe('');
  });

  it('returns "" for empty string (falsy)', () => {
    expect(formatRelativeChatTime('')).toBe('');
  });
});

describe('formatRelativeChatTime — bucket: "now" (< 1 minute)', () => {
  it('returns general.now when the timestamp is the current instant', () => {
    expect(formatRelativeChatTime(NOW.toISOString())).toBe('[t:general.now]');
  });

  it('returns general.now for ~20s ago (Math.round still yields 0 minutes)', () => {
    const t = new Date(NOW.getTime() - 20_000).toISOString();
    expect(formatRelativeChatTime(t)).toBe('[t:general.now]');
  });

  it('crosses into the minutes bucket at the Math.round(0.5)=1 boundary (~30s)', () => {
    // Pinning the rounding rule: 30s diff → diffMin = Math.round(0.5) = 1
    // (round-half-up), so 30s ago is treated as 1 minute, not "now".
    const t = new Date(NOW.getTime() - 30_000).toISOString();
    expect(formatRelativeChatTime(t)).toBe('[t:chat.minutesAgoShort|count=1]');
  });

  it('clamps negative diffs (future timestamps) to "now"', () => {
    const future = new Date(NOW.getTime() + 5 * 60_000).toISOString();
    expect(formatRelativeChatTime(future)).toBe('[t:general.now]');
  });
});

describe('formatRelativeChatTime — bucket: minutes (1 ≤ diffMin < 60)', () => {
  it('1 minute ago → minutesAgoShort{count:1}', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(1))).toBe('[t:chat.minutesAgoShort|count=1]');
  });

  it('30 minutes ago → minutesAgoShort{count:30}', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(30))).toBe('[t:chat.minutesAgoShort|count=30]');
  });

  it('59 minutes ago → minutesAgoShort{count:59} (boundary just below 60)', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(59))).toBe('[t:chat.minutesAgoShort|count=59]');
  });
});

describe('formatRelativeChatTime — bucket: hours (1 ≤ rounded hours < 24)', () => {
  it('60 minutes ago → hoursAgo{count:1} (crosses the hour boundary)', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(60))).toBe('[t:general.hoursAgo|count=1]');
  });

  it('3 hours ago → hoursAgo{count:3}', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(180))).toBe('[t:general.hoursAgo|count=3]');
  });

  it('23 hours ago → hoursAgo{count:23} (boundary just below 24)', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(23 * 60))).toBe('[t:general.hoursAgo|count=23]');
  });
});

describe('formatRelativeChatTime — bucket: days (rounded hours ≥ 24)', () => {
  it('24 hours ago → daysAgo{count:1} (crosses the day boundary)', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(24 * 60))).toBe('[t:general.daysAgo|count=1]');
  });

  it('7 days ago → daysAgo{count:7}', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(7 * 24 * 60))).toBe('[t:general.daysAgo|count=7]');
  });

  it('30 days ago → daysAgo{count:30}', () => {
    expect(formatRelativeChatTime(isoMinutesAgo(30 * 24 * 60))).toBe('[t:general.daysAgo|count=30]');
  });
});
