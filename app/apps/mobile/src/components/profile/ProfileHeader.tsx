// app/apps/mobile/src/components/profile/ProfileHeader.tsx
// Shared profile header — avatar + display name + privacy lock + bio.
// Used by (tabs)/profile.tsx and user/[handle]/index.tsx.
// Mapped to: FR-PROFILE-001 AC1, FR-PROFILE-002 AC1, FR-PROFILE-011, 012.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@kc/ui';
import { AvatarInitials } from '../AvatarInitials';

export interface ProfileHeaderProps {
  displayName: string;
  handle?: string | null;
  avatarUrl: string | null;
  biography: string | null;
  privacyMode: 'Public' | 'Private';
  onLockPress?: () => void;
  size?: number;
}

export function ProfileHeader({
  displayName, handle, avatarUrl, biography, privacyMode, onLockPress, size = 96,
}: ProfileHeaderProps) {
  const showLock = privacyMode === 'Private';
  return (
    <View style={styles.wrap}>
      <AvatarInitials name={displayName} avatarUrl={avatarUrl} size={size} />
      <View style={styles.nameRow}>
        <Text style={styles.displayName}>{displayName}</Text>
        {showLock ? (
          <TouchableOpacity onPress={onLockPress} accessibilityLabel="פרופיל פרטי">
            <Ionicons
              name="lock-closed"
              size={18}
              color={colors.textSecondary}
              style={styles.lock}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {handle ? <Text style={styles.handle}>@{handle}</Text> : null}
      {biography ? <Text style={styles.bio}>{biography}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  displayName: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  lock: { marginTop: 2 },
  handle: { ...typography.body, color: colors.textSecondary },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'center', paddingHorizontal: spacing.md },
});
