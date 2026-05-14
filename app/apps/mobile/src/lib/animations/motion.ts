/**
 * Motion design tokens — single source of truth for all animation constants.
 *
 * Easing functions (which require react-native-reanimated) live in motion-easings.ts
 * so this file stays testable in a pure Node/vitest environment.
 */

export const MOTION = {
  duration: {
    instant: 0,
    fast: 150,
    base: 220,
    slow: 320,
  },
  spring: {
    damping: 18,
    stiffness: 240,
    mass: 1,
  },
  entryDistance: 12,
  staggerStep: 70,
  pressScale: 0.96,
} as const;

export function staggerDelay(index: number): number {
  return index * MOTION.staggerStep;
}

export interface MotionConfig {
  readonly duration: number;
  readonly distance: number;
  readonly delay: number;
}

export function applyReducedMotion(
  cfg: MotionConfig,
  reduced: boolean,
): MotionConfig {
  if (!reduced) return cfg;
  return { duration: 0, distance: 0, delay: 0 };
}
