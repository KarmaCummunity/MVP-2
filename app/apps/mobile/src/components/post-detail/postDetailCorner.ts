import { Platform, type ViewStyle } from 'react-native';
import { spacing } from '@kc/ui';
import { isLayoutRtl } from '../../lib/rtlLayout';

const isWeb = Platform.OS === 'web';

/** Top inline-start corner on the post-detail hero (status badge). */
export function heroCornerStart(inset = spacing.base): Pick<ViewStyle, 'left' | 'right' | 'start'> {
  if (!isWeb) return { start: inset };
  return isLayoutRtl() ? { right: inset } : { left: inset };
}

/** Bottom inline-end corner on the post-detail hero (type tag). */
export function heroCornerEnd(inset = spacing.base): Pick<ViewStyle, 'left' | 'right' | 'end'> {
  if (!isWeb) return { end: inset };
  return isLayoutRtl() ? { left: inset } : { right: inset };
}
