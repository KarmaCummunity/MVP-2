// app/apps/mobile/src/components/profile/LockedPanel.tsx
// Empty state shown to a non-follower viewing a Private profile (FR-PROFILE-003).
// Mapped to: FR-PROFILE-003 AC2.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';

export interface LockedPanelProps {
  hint?: string;
}

export function LockedPanel({ hint }: LockedPanelProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="lock-closed" size={36} color={colors.textSecondary} />
      <Text style={styles.title}>פרופיל פרטי</Text>
      <Text style={styles.body}>
        שלח בקשה לעקוב כדי לראות פוסטים, עוקבים ונעקבים.
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: spacing.base, padding: spacing.lg, backgroundColor: colors.surface,
    borderRadius: radius.lg, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
