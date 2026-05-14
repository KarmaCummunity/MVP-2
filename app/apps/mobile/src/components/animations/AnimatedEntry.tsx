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
  readonly style?: StyleProp<ViewStyle>;
}

export function AnimatedEntry({
  children,
  delay = 0,
  duration = MOTION.duration.base,
  distance = MOTION.entryDistance,
  style,
}: AnimatedEntryProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    const d = reduced ? 0 : duration;
    const wait = reduced ? 0 : delay;
    opacity.value = withDelay(wait, withTiming(1, { duration: d, easing: EASINGS.easeOut }));
    translateY.value = withDelay(wait, withTiming(0, { duration: d, easing: EASINGS.easeOut }));
  }, [reduced, delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
