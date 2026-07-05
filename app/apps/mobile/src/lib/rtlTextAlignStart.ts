import { Platform } from 'react-native';
import { isLayoutRtl } from './rtlLayout';

/**
 * `textAlign` toward the reading-start edge for the active layout direction.
 * - Web RTL (Hebrew, `dir="rtl"`): inline-start is physical `right`.
 * - Web LTR (English, `dir="ltr"`): inline-start is physical `left`.
 * - Native + `I18nManager.forceRTL`: physical `left` mirrors to inline-start.
 *
 * FR-SETTINGS-018: direction-aware on web so English aligns left. Evaluated at
 * module load; the app reloads on a language switch, so this re-resolves for the
 * new direction.
 *
 * Typed as `'left' | 'right'` (narrower than `TextStyle['textAlign']`) so it
 * also satisfies the `TextInput` `textAlign` prop, which excludes `'auto'`/`'justify'`.
 */
export const rtlTextAlignStart: 'left' | 'right' =
  Platform.OS === 'web' ? (isLayoutRtl() ? 'right' : 'left') : 'left';

/**
 * Reading-end edge (visual left in RTL Hebrew, visual right in LTR English).
 * Pair with actions such as a "show all" affordance pinned to the end gutter.
 */
export const rtlTextAlignEnd: 'left' | 'right' =
  Platform.OS === 'web' ? (isLayoutRtl() ? 'left' : 'right') : 'right';
