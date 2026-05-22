import { Platform, type TextStyle, type ViewStyle } from 'react-native';

function isWebPlatform(): boolean {
  try {
    return Platform.OS === 'web';
  } catch {
    return false;
  }
}

/**
 * RN-web: reinforce RTL layout/text bidi where DOM `dir=rtl` + RN-web
 * don't match native `I18nManager.forceRTL` parity.
 *
 * iOS/Android: **omit** — `I18nManager.forceRTL(true)` already mirrors the tree;
 * adding `direction` / `writingDirection` again inverts rows + text vs web.
 */
export const webViewRtl: ViewStyle = isWebPlatform() ? { direction: 'rtl' } : {};

export const webTextRtl: TextStyle = isWebPlatform() ? { writingDirection: 'rtl' } : {};
