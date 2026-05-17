// MotionEntry — staggered entry primitive matching the welcome screen idiom.
//
// Three variants line up with the three "sections" of the welcome screen:
//   - hero    : fade + translateY 28 → 0,  spring(damping 18, stiffness 90)
//   - side    : fade + translateX 24 → 0,  spring(damping 20, stiffness 100)
//   - bottom  : fade + translateY 24 → 0,  spring(damping 18)
//
// The component honors prefers-reduced-motion (renders the final state with no
// transform).
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Variant = 'hero' | 'side' | 'bottom';

interface MotionEntryProps {
  readonly children: React.ReactNode;
  readonly variant?: Variant;
  readonly delay?: number;
  readonly style?: StyleProp<ViewStyle>;
}

const CONFIG = {
  hero: {
    translateY: 28,
    translateX: 0,
    spring: { damping: 18, stiffness: 90 },
    duration: 500,
  },
  side: {
    translateY: 0,
    translateX: 24,
    spring: { damping: 20, stiffness: 100 },
    duration: 450,
  },
  bottom: {
    translateY: 24,
    translateX: 0,
    spring: { damping: 18, stiffness: 100 },
    duration: 400,
  },
} as const;

export function MotionEntry({
  children,
  variant = 'bottom',
  delay = 0,
  style,
}: MotionEntryProps) {
  const reduced = useReducedMotion();
  const cfg = CONFIG[variant];
  const opacity = useSharedValue(reduced ? 1 : 0);
  const ty = useSharedValue(reduced ? 0 : cfg.translateY);
  const tx = useSharedValue(reduced ? 0 : cfg.translateX);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      ty.value = 0;
      tx.value = 0;
      return;
    }
    opacity.value = withDelay(delay, withTiming(1, { duration: cfg.duration }));
    ty.value = withDelay(delay, withSpring(0, cfg.spring));
    tx.value = withDelay(delay, withSpring(0, cfg.spring));
  }, [reduced, delay, cfg.duration, cfg.spring, opacity, ty, tx]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { translateX: tx.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/** Recommended stagger offsets that mirror the welcome screen. */
export const ENTRY_DELAY = {
  hero: 0,
  section: 300,
  buttons: 520,
  decorative: 600,
} as const;
