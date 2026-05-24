import { describe, expect, it } from 'vitest';
import { spacing, shellDimensions } from '@kc/ui';
import {
  computePostGridCardWidth,
  computeShellContentWidth,
} from '../useShellContentWidth';

describe('computeShellContentWidth', () => {
  it('returns full window width on mobile', () => {
    expect(computeShellContentWidth(375, 'mobile')).toBe(375);
  });

  it('subtracts collapsed rail on tablet and caps at contentMaxTablet', () => {
    const width = 800;
    const expected = Math.min(
      width - shellDimensions.railCollapsed,
      shellDimensions.contentMaxTablet,
    );
    expect(computeShellContentWidth(width, 'tablet', 'web')).toBe(expected);
  });

  it('subtracts rail + aside on desktop and caps at contentMaxDesktop', () => {
    const width = 1200;
    const chrome =
      shellDimensions.railExpanded + shellDimensions.aside + spacing.base * 2;
    const expected = Math.min(width - chrome, shellDimensions.contentMaxDesktop);
    expect(computeShellContentWidth(width, 'desktop', 'web')).toBe(expected);
  });

  it('caps at contentMaxWide on wide viewports', () => {
    const width = 1600;
    const chrome =
      shellDimensions.railExpanded + shellDimensions.aside + spacing.base * 2;
    const expected = Math.min(width - chrome, shellDimensions.contentMaxWide);
    expect(computeShellContentWidth(width, 'wide', 'web')).toBe(expected);
  });
});

describe('computePostGridCardWidth', () => {
  it('fits two columns for a 720px content area (home feed)', () => {
    const card = computePostGridCardWidth(720, 2, spacing.base, spacing.sm);
    const row = card * 2 + spacing.sm + spacing.base * 2;
    expect(row).toBeLessThanOrEqual(720 + 0.01);
    expect(card).toBeGreaterThan(0);
  });

  it('fits three columns for a 720px content area (profile grid)', () => {
    const card = computePostGridCardWidth(720, 3, spacing.base, spacing.xs);
    const row = card * 3 + spacing.xs * 2 + spacing.base * 2;
    expect(row).toBeLessThanOrEqual(720 + 0.01);
    expect(card).toBeGreaterThan(0);
  });
});
