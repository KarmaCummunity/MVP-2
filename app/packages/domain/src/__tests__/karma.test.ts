import { describe, it, expect } from 'vitest';
import {
  KARMA_VALUE_BONUS_DIVISOR,
  KARMA_VALUE_BONUS_CAP_VALUE,
  computeValueBonus,
} from '../karma';

describe('karma value-bonus constants (mirror the SQL source of truth — keep in sync with 0099)', () => {
  it('matches the approved divisor + cap', () => {
    expect(KARMA_VALUE_BONUS_DIVISOR).toBe(50);
    expect(KARMA_VALUE_BONUS_CAP_VALUE).toBe(1000);
  });
});

describe('computeValueBonus', () => {
  it('is 0 for null/undefined/zero/negative', () => {
    expect(computeValueBonus(null)).toBe(0);
    expect(computeValueBonus(undefined)).toBe(0);
    expect(computeValueBonus(0)).toBe(0);
    expect(computeValueBonus(-200)).toBe(0);
  });
  it('scales by divisor with rounding', () => {
    expect(computeValueBonus(50)).toBe(1);
    expect(computeValueBonus(75)).toBe(2); // round(1.5) = 2
    expect(computeValueBonus(100)).toBe(2);
    expect(computeValueBonus(500)).toBe(10);
    expect(computeValueBonus(1000)).toBe(20);
  });
  it('clamps above the cap value', () => {
    expect(computeValueBonus(1001)).toBe(20);
    expect(computeValueBonus(9999)).toBe(20);
  });
});
