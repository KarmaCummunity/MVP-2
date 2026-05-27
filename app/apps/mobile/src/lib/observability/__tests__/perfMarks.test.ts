import { describe, expect, it, beforeEach, vi } from 'vitest';
import { startMark, finishMark, _resetForTests } from '../perfMarks';

describe('perfMarks', () => {
  beforeEach(() => _resetForTests());

  it('no-ops cleanly when no mark started', () => {
    expect(() => finishMark('feed.first_render')).not.toThrow();
  });

  it('idempotent start', () => {
    startMark('app.cold_start');
    expect(() => startMark('app.cold_start')).not.toThrow();
  });

  it('returns true first, false repeat', () => {
    startMark('image.first_paint');
    expect(finishMark('image.first_paint')).toBe(true);
    expect(finishMark('image.first_paint')).toBe(false);
  });
});

// Regression: the production crash this module caused was
//   TypeError: s.finish is not a function
// after the Sentry v8 SDK renamed span.finish() to span.end(). The helper must
// survive both shapes — we never throw out of finishMark.
describe('perfMarks — span shape compatibility', () => {
  it('does not throw on a Sentry-v8-shaped span (end() only)', () => {
    const span = { end: vi.fn() };
    vi.doMock('@sentry/react-native', () => ({
      startInactiveSpan: () => span,
    }));
    // Re-import to pick up the mocked module
    return import('../perfMarks').then(mod => {
      mod._resetForTests();
      mod.startMark('app.cold_start');
      expect(() => mod.finishMark('app.cold_start')).not.toThrow();
      vi.doUnmock('@sentry/react-native');
    });
  });

  it('does not throw on a Sentry-v7-shaped span (finish() only)', () => {
    const span = { finish: vi.fn() };
    vi.doMock('@sentry/react-native', () => ({
      startInactiveSpan: () => span,
    }));
    return import('../perfMarks').then(mod => {
      mod._resetForTests();
      mod.startMark('app.cold_start');
      expect(() => mod.finishMark('app.cold_start')).not.toThrow();
      vi.doUnmock('@sentry/react-native');
    });
  });

  it('does not throw on a span with neither end() nor finish() (defensive)', () => {
    const span = {};
    vi.doMock('@sentry/react-native', () => ({
      startInactiveSpan: () => span,
    }));
    return import('../perfMarks').then(mod => {
      mod._resetForTests();
      mod.startMark('app.cold_start');
      expect(() => mod.finishMark('app.cold_start')).not.toThrow();
      vi.doUnmock('@sentry/react-native');
    });
  });
});
