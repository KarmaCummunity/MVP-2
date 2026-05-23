export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type BreakpointToken = keyof typeof BREAKPOINTS;

const TOKEN_ORDER: readonly BreakpointToken[] = ['mobile', 'tablet', 'desktop', 'wide'];

export function resolveBreakpoint(width: number): BreakpointToken {
  let active: BreakpointToken = 'mobile';
  for (const token of TOKEN_ORDER) {
    if (width >= BREAKPOINTS[token]) {
      active = token;
    }
  }
  return active;
}
