// Animated input with orange border glow on focus — RTL-ready.
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '@kc/ui';

interface AnimatedAuthInputProps extends TextInputProps {
  label: string;
}

export function AnimatedAuthInput({
  label,
  onFocus,
  onBlur,
  ...rest
}: AnimatedAuthInputProps) {
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(0);

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setFocused(true);
    scale.value = withTiming(1.015, { duration: 150 });
    borderProgress.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setFocused(false);
    scale.value = withTiming(1, { duration: 150 });
    borderProgress.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.field}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          wrapperStyle,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </Animated.View>
    </View>
  );
}

const ORANGE = '#F97316';

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  labelFocused: {
    color: ORANGE,
  },
  inputContainer: {
    height: 54,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: ORANGE,
    backgroundColor: '#FFFBF7',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
});
