import { Platform, type TextStyle } from 'react-native';

/**
 * `textAlign` toward Hebrew reading start (visual right).
 * - Native + `I18nManager.forceRTL(true)`: physical `left` mirrors to inline-start.
 * - Web + `document.documentElement.dir = 'rtl'`: physical `right` is inline-start.
 */
export const rtlTextAlignStart: NonNullable<TextStyle['textAlign']> =
  Platform.OS === 'web' ? 'right' : 'left';
