// Computes the effective <main> content width inside AppShell on web desktop.
// Post grids must use this instead of Dimensions.get('window') so cards fit the
// centered column and are not clipped by the navigation rail / aside panel.
// Mapped to: FR-RESP-002.

import { Platform, useWindowDimensions } from 'react-native';
import { shellDimensions, spacing, useBreakpoint, type BreakpointToken } from '@kc/ui';

export function computeShellContentWidth(
  windowWidth: number,
  bp: BreakpointToken,
  platform: typeof Platform.OS = Platform.OS,
): number {
  if (platform !== 'web' || bp === 'mobile') {
    return windowWidth;
  }

  const railWidth =
    bp === 'desktop' || bp === 'wide'
      ? shellDimensions.railExpanded
      : shellDimensions.railCollapsed;

  const asideWidth =
    bp === 'desktop' || bp === 'wide'
      ? shellDimensions.aside + spacing.base * 2
      : 0;

  const contentMax =
    bp === 'wide'
      ? shellDimensions.contentMaxWide
      : bp === 'desktop'
        ? shellDimensions.contentMaxDesktop
        : shellDimensions.contentMaxTablet;

  const flexMain = windowWidth - railWidth - asideWidth;
  return Math.min(Math.max(flexMain, 0), contentMax);
}

export function computePostGridCardWidth(
  contentWidth: number,
  columns: number,
  padding: number = spacing.base,
  gap: number = spacing.sm,
): number {
  return (contentWidth - padding * 2 - gap * (columns - 1)) / columns;
}

export function useShellContentWidth(): number {
  const { width } = useWindowDimensions();
  const bp = useBreakpoint();
  return computeShellContentWidth(width, bp);
}

/** Home feed = 2 columns; profile grids = 3 columns. */
export function usePostGridCardWidth(columns: 2 | 3, gap?: number): number {
  const resolvedGap = gap ?? (columns === 2 ? spacing.sm : spacing.xs);
  const contentWidth = useShellContentWidth();
  return computePostGridCardWidth(contentWidth, columns, spacing.base, resolvedGap);
}
