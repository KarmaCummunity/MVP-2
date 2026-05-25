import { Platform } from 'react-native';

/**
 * `textAlign` toward Hebrew reading start (visual right).
 * - Native + `I18nManager.forceRTL(true)`: physical `left` mirrors to inline-start.
 * - Web + `document.documentElement.dir = 'rtl'`: physical `right` is inline-start.
 *
 * Typed as `'left' | 'right'` (narrower than `TextStyle['textAlign']`) so it
 * also satisfies the `TextInput` `textAlign` prop, which excludes `'auto'`/`'justify'`.
 */
export const rtlTextAlignStart: 'left' | 'right' =
  Platform.OS === 'web' ? 'right' : 'left';

/**
 * Reading-end edge (visual left in forced RTL Hebrew).
 * Pair with actions such as "הצג הכל" pinned to the screen's left gutter.
 */
export const rtlTextAlignEnd: 'left' | 'right' =
  Platform.OS === 'web' ? 'left' : 'right';
