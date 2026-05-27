import { describe, expect, it, beforeEach } from 'vitest';
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
