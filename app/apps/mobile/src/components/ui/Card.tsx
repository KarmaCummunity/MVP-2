// Card primitive — white surface with subtle shadow + 14px radius.
// Matches the value-prop rows on the welcome screen. Use it for any content
// that should sit "above" the cream backdrop.
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing } from '@kc/ui';

interface CardProps {
  readonly children: React.ReactNode;
  readonly onPress?: () => void;
  readonly padding?: keyof typeof spacing;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  padding = 'base',
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const padStyle = { padding: spacing[padding] };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, padStyle, pressed && styles.pressed, style]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, padStyle, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
