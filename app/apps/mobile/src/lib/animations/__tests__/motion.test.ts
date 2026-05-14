import { describe, expect, it } from 'vitest';
import { MOTION, staggerDelay, applyReducedMotion } from '../motion';

describe('motion tokens', () => {
  it('exposes durations in ms', () => {
    expect(MOTION.duration.instant).toBe(0);
    expect(MOTION.duration.fast).toBe(150);
    expect(MOTION.duration.base).toBe(220);
    expect(MOTION.duration.slow).toBe(320);
  });

  it('exposes a 12px entry distance', () => {
    expect(MOTION.entryDistance).toBe(12);
  });

  it('staggerDelay returns 0 for the first child', () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it('staggerDelay increments by 70ms', () => {
    expect(staggerDelay(1)).toBe(70);
    expect(staggerDelay(3)).toBe(210);
  });

  it('applyReducedMotion zeroes duration + distance when reduced', () => {
    const cfg = { duration: 220, distance: 12, delay: 70 };
    expect(applyReducedMotion(cfg, true)).toEqual({ duration: 0, distance: 0, delay: 0 });
    expect(applyReducedMotion(cfg, false)).toEqual(cfg);
  });
});
