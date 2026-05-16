// app/apps/mobile/src/components/profile/ProfileHeader.tsx
// Shared profile header — avatar + display name + privacy lock + bio.
// Used by My Profile tab routes and user/[handle]/index.tsx.
// Mapped to: FR-PROFILE-001 AC1, FR-PROFILE-002 AC1, FR-PROFILE-011, 012.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@kc/ui';
import { AvatarInitials } from '../AvatarInitials';
import { isOpaqueSystemShareHandle } from '../../lib/shareHandleDisplay';

export interface ProfileHeaderProps {
  displayName: string;
  handle?: string | null;
  /** City only; profile street/number is not shown on headers. */
  locationLine?: string | null;
  avatarUrl: string | null;
  biography: string | null;
  privacyMode: 'Public' | 'Private';
  onLockPress?: () => void;
  size?: number;
}

export function ProfileHeader({
  displayName, handle, locationLine, avatarUrl, biography, privacyMode, onLockPress, size = 96,
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
      {handle && !isOpaqueSystemShareHandle(handle) ? (
        <Text style={styles.handle}>@{handle}</Text>
      ) : null}
      {locationLine ? <Text style={styles.location}>{locationLine}</Text> : null}
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
  location: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'center', paddingHorizontal: spacing.md },
});
