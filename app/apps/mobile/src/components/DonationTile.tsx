// Donation Hub tile — used by /(tabs)/donations.
// Mapped to: FR-DONATE-001 AC2 / FR-DONATE-006 / D-16.
//
// Two layouts:
//   - default (`compact={false}`): full-width row with icon on right, chevron on left.
//     Used historically for items/time/money.
//   - compact (`compact={true}`): square-ish card optimised for a 2-column grid.
//     Icon top-center, title + subtitle stacked below. Used by the Hub now that
//     all 9 categories live in the same grid (FR-DONATE-006).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';

interface DonationTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  compact?: boolean;
  testID?: string;
}

export function DonationTile({
  icon,
  title,
  subtitle,
  onPress,
  compact = false,
  testID,
}: DonationTileProps) {
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title} — ${subtitle}`}
        style={({ pressed }) => [styles.tileCompact, pressed && styles.tilePressed]}
        testID={testID}
      >
        <View style={styles.iconWrapCompact}>
          <Ionicons name={icon} size={28} color={colors.primary} />
        </View>
        <Text style={styles.titleCompact} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitleCompact} numberOfLines={2}>{subtitle}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${subtitle}`}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      testID={testID}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 96,
    flexDirection: 'row-reverse', // RTL: icon right, chevron left
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    ...shadow.card,
  },
  tileCompact: {
    flex: 1,
    minHeight: 132,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.xs,
    ...shadow.card,
  },
  tilePressed: { backgroundColor: colors.background, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  textBlock: { flex: 1 },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  titleCompact: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitleCompact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
