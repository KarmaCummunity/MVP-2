import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MOTION } from '../../lib/animations/motion';
import { EASINGS } from '../../lib/animations/motion-easings';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AnimatedEntryProps {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly duration?: number;
  readonly distance?: number;
  /** When set (e.g. 0.96), scales from this value to 1 alongside the fade/slide. */
  readonly scaleEntrance?: number;
  readonly style?: StyleProp<ViewStyle>;
}

export function AnimatedEntry({
  children,
  delay = 0,
  duration = MOTION.duration.base,
  distance = MOTION.entryDistance,
  scaleEntrance,
  style,
}: AnimatedEntryProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);
  const scale = useSharedValue(scaleEntrance ?? 1);

  useEffect(() => {
    const d = reduced ? 0 : duration;
    const wait = reduced ? 0 : delay;
    const startScale = reduced ? 1 : scaleEntrance ?? 1;
    scale.value = startScale;
    opacity.value = withDelay(wait, withTiming(1, { duration: d, easing: EASINGS.easeOut }));
    translateY.value = withDelay(wait, withTiming(0, { duration: d, easing: EASINGS.easeOut }));
    scale.value = withDelay(wait, withTiming(1, { duration: d, easing: EASINGS.easeOut }));
  }, [reduced, delay, duration, scaleEntrance, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
