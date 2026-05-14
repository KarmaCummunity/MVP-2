/**
 * Reanimated easing presets.
 *
 * Separated from motion.ts so that the core token file stays importable
 * in a pure Node/vitest environment without native module errors.
 *
 * UI components that need animated transitions should import from both:
 *   import { MOTION } from './motion';
 *   import { EASINGS } from './motion-easings';
 */
import { Easing } from 'react-native-reanimated';

export const EASINGS = {
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
} as const;
