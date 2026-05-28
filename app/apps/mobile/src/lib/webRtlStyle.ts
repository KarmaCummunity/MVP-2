import { Platform, type TextStyle, type ViewStyle } from 'react-native';

function isWebPlatform(): boolean {
  try {
    return Platform.OS === 'web';
  } catch {
    return false;
  }
}

/**
 * View-level RTL on web comes from `document.documentElement.dir` (see `_layout.tsx`).
 * RN-Web rejects the CSS `direction` property on `View` styles — it logs once per
 * affected node ("Did you mean writingDirection?"), which floods LogBox when spread
 * widely. Keep this empty; use `webTextRtl`, `rowDirectionStart`, and `textAlignStart`.
 *
 * iOS/Android: **omit** — `I18nManager.forceRTL(true)` already mirrors the tree.
 */
export const webViewRtl: ViewStyle = {};

export const webTextRtl: TextStyle = isWebPlatform() ? { writingDirection: 'rtl' } : {};
