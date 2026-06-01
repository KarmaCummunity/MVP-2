// Card primitive — theme-aware surface with subtle shadow + 14px radius.
// Matches the value-prop rows on the welcome screen. Use it for any content
// that should sit "above" the cream backdrop.
import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeUseStyles, radius, spacing } from '@kc/ui';

interface CardProps {
  readonly children: React.ReactNode;
  readonly onPress?: () => void;
  readonly padding?: keyof typeof spacing;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
}

const useStyles = makeUseStyles(({ colors, isDark }) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 4,
    elevation: isDark ? 0 : 1,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
}));

export function Card({
  children,
  onPress,
  padding = 'base',
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const styles = useStyles();
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
