import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * RN-web: reinforce RTL layout/text bidi where the DOM `dir=rtl` + RN-web
 * don't match native parity.
 *
 * iOS/Android: **omit** — `I18nManager.forceRTL(true)` already mirrors the tree;
 * adding `direction` / `writingDirection` again inverts rows + text vs web.
 */
export const aboutWebViewRtl: ViewStyle = Platform.OS === 'web' ? { direction: 'rtl' } : {};

export const aboutWebTextRtl: TextStyle = Platform.OS === 'web' ? { writingDirection: 'rtl' } : {};
