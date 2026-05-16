import { describe, expect, it } from 'vitest';
import { parseTruthyQueryParam } from '../parseTruthyQueryParam';

describe('parseTruthyQueryParam', () => {
  it('returns false for undefined, empty, and falsey strings', () => {
    expect(parseTruthyQueryParam(undefined)).toBe(false);
    expect(parseTruthyQueryParam('')).toBe(false);
    expect(parseTruthyQueryParam('false')).toBe(false);
    expect(parseTruthyQueryParam('0')).toBe(false);
  });

  it('accepts true, 1, yes (case-insensitive)', () => {
    expect(parseTruthyQueryParam('true')).toBe(true);
    expect(parseTruthyQueryParam('TRUE')).toBe(true);
    expect(parseTruthyQueryParam('1')).toBe(true);
    expect(parseTruthyQueryParam('yes')).toBe(true);
    expect(parseTruthyQueryParam('YES')).toBe(true);
  });

  it('uses first element when given an array', () => {
    expect(parseTruthyQueryParam(['true', 'false'])).toBe(true);
    expect(parseTruthyQueryParam(['false', 'true'])).toBe(false);
  });
});
