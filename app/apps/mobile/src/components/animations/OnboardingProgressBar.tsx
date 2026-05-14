import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '@kc/ui';
import { MOTION } from '../../lib/animations/motion';
import { EASINGS } from '../../lib/animations/motion-easings';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface OnboardingProgressBarProps {
  readonly step: 1 | 2 | 3 | 4;
  readonly total?: number;
}

export function OnboardingProgressBar({ step, total = 4 }: OnboardingProgressBarProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(step / total);

  useEffect(() => {
    const d = reduced ? 0 : MOTION.duration.slow;
    progress.value = withTiming(step / total, { duration: d, easing: EASINGS.easeOut });
  }, [step, total, reduced, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: step, min: 0, max: total }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
