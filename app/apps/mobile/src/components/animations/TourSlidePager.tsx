import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, I18nManager } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, typography, spacing } from '@kc/ui';
import { MOTION } from '../../lib/animations/motion';
import { EASINGS } from '../../lib/animations/motion-easings';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface TourSlide {
  readonly emoji: string;
  readonly title: string;
  readonly body: string;
}

export interface TourSlidePagerProps {
  readonly slides: readonly TourSlide[];
  readonly index: number;
  readonly onIndexChange: (next: number) => void;
}

const SWIPE_THRESHOLD = 60;

export function TourSlidePager({ slides, index, onIndexChange }: TourSlidePagerProps) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const tx = useSharedValue(0);
  const emojiScale = useSharedValue(1);
  const direction = I18nManager.isRTL ? -1 : 1;

  useEffect(() => {
    const d = reduced ? 0 : MOTION.duration.base;
    tx.value = withTiming(0, { duration: d, easing: EASINGS.easeOut });
    if (!reduced) {
      emojiScale.value = 0.6;
      emojiScale.value = withSpring(1, MOTION.spring);
    }
  }, [index, reduced, tx, emojiScale]);

  const commit = (next: number) => {
    if (next < 0 || next >= slides.length) {
      tx.value = withTiming(0, { duration: MOTION.duration.fast });
      return;
    }
    onIndexChange(next);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      const dx = e.translationX * direction;
      if (dx < -SWIPE_THRESHOLD) runOnJS(commit)(index + 1);
      else if (dx > SWIPE_THRESHOLD) runOnJS(commit)(index - 1);
      else tx.value = withTiming(0, { duration: MOTION.duration.fast });
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const slide = slides[index]!;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.content, trackStyle, { width }]}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>{slide.emoji}</Animated.Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </Animated.View>
      </GestureDetector>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Dot key={i} active={i === index} />
        ))}
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(active ? 24 : 8);

  useEffect(() => {
    const d = reduced ? 0 : MOTION.duration.base;
    w.value = withTiming(active ? 24 : 8, { duration: d, easing: EASINGS.easeOut });
  }, [active, reduced, w]);

  const dotStyle = useAnimatedStyle(() => ({
    width: w.value,
    backgroundColor: active ? colors.primary : colors.border,
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 96, marginBottom: spacing.xl },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
