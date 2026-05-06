// ─────────────────────────────────────────────
// Typography — Karma Community
// Hebrew RTL — using system font (SF Pro on iOS, Roboto on Android)
// ─────────────────────────────────────────────

import { Platform } from 'react-native';

// Wrapped in try/catch: Platform.select fails in SSR/Node contexts (expo-router 5 route analysis).
// Runtime behavior on iOS/Android/Web is unchanged.
export const fontFamily = (() => {
  try {
    return Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }) ?? 'System';
  } catch {
    return 'System';
  }
})();

export const typography = {
  // Display
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },

  // Body
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },

  // Emphasis
  semiBold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },

  // UI
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
} as const;
