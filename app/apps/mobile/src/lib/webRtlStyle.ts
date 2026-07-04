import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { isLayoutRtl } from './rtlLayout';

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

/**
 * Web-only text `writingDirection` for the active locale (FR-SETTINGS-018).
 * RTL (Hebrew) → `rtl`; LTR (English) → `ltr`. Re-resolves after a language
 * switch because the app reloads. Native omits it (I18nManager handles bidi).
 */
export const webTextRtl: TextStyle = isWebPlatform()
  ? { writingDirection: isLayoutRtl() ? 'rtl' : 'ltr' }
  : {};
