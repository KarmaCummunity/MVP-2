import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp, AccessibilityProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOTION } from '../../lib/animations/motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface PressableScaleProps extends AccessibilityProps {
  readonly children: React.ReactNode;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly haptic?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly hitSlop?: number;
}

export function PressableScale({
  children,
  onPress,
  disabled = false,
  haptic = true,
  style,
  hitSlop,
  ...a11y
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = reduced ? 1 : withSpring(MOTION.pressScale, MOTION.spring);
  };
  const handlePressOut = () => {
    scale.value = reduced ? 1 : withSpring(1, MOTION.spring);
  };
  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Apply `style` on `Pressable`, not only the inner `Animated.View`. Layout
  // props like `flex: 1` / `width: '100%'` must live on the outer node so row
  // parents (e.g. donations grid) size the hit target; RN-Web + RTL otherwise
  // shrink-wraps to content and leaves empty space on the opposite edge.
  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      style={style}
      {...a11y}
    >
      <Animated.View style={[styles.inner, animated]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: { width: '100%', alignSelf: 'stretch' },
});
