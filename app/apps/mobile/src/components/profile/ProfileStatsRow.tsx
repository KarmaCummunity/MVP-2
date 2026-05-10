// app/apps/mobile/src/components/profile/ProfileStatsRow.tsx
// Three counters: followers / following / posts. Tappable when not locked.
// Mapped to: FR-PROFILE-001 AC2, FR-PROFILE-002 AC3, FR-PROFILE-013.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '@kc/ui';

export interface ProfileStatsRowProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  enabled: boolean;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export function ProfileStatsRow({
  followersCount, followingCount, postsCount, enabled,
  onPressFollowers, onPressFollowing,
}: ProfileStatsRowProps) {
  return (
    <View style={styles.row}>
      <Stat
        count={followersCount}
        label="עוקבים"
        onPress={enabled ? onPressFollowers : undefined}
      />
      <View style={styles.divider} />
      <Stat
        count={followingCount}
        label="נעקבים"
        onPress={enabled ? onPressFollowing : undefined}
      />
      <View style={styles.divider} />
      <Stat count={postsCount} label="פוסטים" />
    </View>
  );
}

function Stat({
  count, label, onPress,
}: { count: number; label: string; onPress?: () => void }) {
  const inner = (
    <View style={styles.stat}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} style={styles.statTouch}>{inner}</TouchableOpacity>
  ) : inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statTouch: { flex: 1 },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  count: { ...typography.h2, color: colors.textPrimary },
  label: { ...typography.caption, color: colors.textSecondary },
});
