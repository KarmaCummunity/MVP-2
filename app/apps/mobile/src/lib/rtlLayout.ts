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

/**
 * Legacy spread hook for web layout bidi. Intentionally empty: RN-Web does not
 * support CSS `direction` on views (see `webRtlStyle.ts`). Html `dir` + flex helpers
 * own layout direction; callers may keep `...layoutDirectionStyle()` harmlessly.
 */
export function layoutDirectionStyle(): ViewStyle {
  return {};
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

/**
 * `flexDirection` for a row laid out from the reading-start edge.
 *
 * Why this exists: the app forces RTL on both platforms (web `dir=rtl`,
 * native `I18nManager.forceRTL(true)`). Native auto-mirrors `flexDirection: 'row'`,
 * so writing `'row-reverse'` there causes a **double flip** back to LTR.
 * RN-Web with `dir=rtl` does *not* auto-mirror `flexDirection: 'row'` in the
 * same way, so web needs the explicit `'row-reverse'` to read right-to-left.
 *
 * Use this helper anywhere a row should follow the active reading direction.
 * If you actually want a physically reversed row (LTR-style on an RTL app),
 * write `'row-reverse'` directly and add a comment explaining why.
 */
export const rowDirectionStart: FlexStyle['flexDirection'] =
  Platform.OS === 'web' ? 'row-reverse' : 'row';

/** Counterpart of {@link rowDirectionStart} for rows that should run end-to-start. */
export const rowDirectionEnd: FlexStyle['flexDirection'] =
  Platform.OS === 'web' ? 'row' : 'row-reverse';
