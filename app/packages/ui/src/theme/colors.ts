// ─────────────────────────────────────────────
// Color Tokens — Karma Community Design System
// ─────────────────────────────────────────────

export const colors = {
  // Brand — warm orange, symbolizes generosity
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FED7AA',
  primarySurface: '#FFF7ED',

  // Secondary — calm indigo for social/community feel
  secondary: '#6366F1',
  secondaryLight: '#E0E7FF',

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  // Warm cream — main-screen backdrop in the redesigned auth/tab idiom.
  surfaceCream: '#FFFBF7',

  // Borders
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Tab bar & navigation
  tabActive: '#F97316',
  tabInactive: '#9CA3AF',

  // Post type tags — aligned with brand palette (orange primary / neutral gray)
  giveTag: '#F97316',
  giveTagBg: '#FFF7ED',
  requestTag: '#FFF7ED',
  requestTagBg: '#F97316',

  // Visibility badges
  publicBadge: '#6B7280',
  followersOnlyBadge: '#8B5CF6',
  onlyMeBadge: '#6B7280',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#F3F4F6',
  shadow: '#000000',
} as const;

export type ColorToken = keyof typeof colors;
