import React from 'react';
import { Pressable, ViewStyle, StyleProp, AccessibilityProps } from 'react-native';
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

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      {...a11y}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
