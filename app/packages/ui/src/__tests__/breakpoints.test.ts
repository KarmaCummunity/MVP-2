import { describe, it, expect } from 'vitest';
import { BREAKPOINTS, type BreakpointToken } from '../theme/breakpoints';

describe('BREAKPOINTS', () => {
  it('defines four tokens in ascending order', () => {
    expect(BREAKPOINTS.mobile).toBe(0);
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
    expect(BREAKPOINTS.wide).toBe(1440);
  });

  it('exports a union token type covering all four', () => {
    const tokens: BreakpointToken[] = ['mobile', 'tablet', 'desktop', 'wide'];
    expect(tokens).toHaveLength(4);
  });
});
