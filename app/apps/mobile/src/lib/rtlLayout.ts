import { I18nManager, Platform, type FlexStyle, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Whether the app layout runs right-to-left.
 * Web reads `document.documentElement.dir`; native uses I18nManager.
 */
export function isLayoutRtl(): boolean {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      const dir = document.documentElement.getAttribute('dir');
      if (dir === 'ltr' || dir === 'rtl') return dir === 'rtl';
    }
    return true;
  }
  return I18nManager.isRTL;
}

/**
 * Cross-axis inline-start. Pair with `layoutDirectionStyle()` on web so
 * `flex-start` resolves to the reading-start edge in both Hebrew and English.
 */
export const crossAxisAlignStart: FlexStyle['alignItems'] = 'flex-start';

/** Self-align to inline-start on the cross axis. */
export const selfAlignStart: FlexStyle['alignSelf'] = 'flex-start';

/** Main-axis inline-start for rows. */
export const mainAxisAlignStart: FlexStyle['justifyContent'] = 'flex-start';

/** Web-only `direction` for the active locale; empty on native. */
export function layoutDirectionStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return { direction: isLayoutRtl() ? 'rtl' : 'ltr' };
}

/** Web-only text `writingDirection` for the active locale. */
export function layoutWritingDirectionStyle(): TextStyle {
  if (Platform.OS !== 'web') return {};
  return { writingDirection: isLayoutRtl() ? 'rtl' : 'ltr' };
}

/**
 * Text aligned to the reading-start edge for the active layout direction.
 * - Web RTL: `right`; web LTR: `left`.
 * - Native: physical `left` (mirrors to inline-start when forceRTL is on).
 */
export function textAlignStart(): NonNullable<TextStyle['textAlign']> {
  if (Platform.OS === 'web') return isLayoutRtl() ? 'right' : 'left';
  return 'left';
}
