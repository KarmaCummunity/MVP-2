// app/apps/mobile/app/user/[handle]/followers.tsx
// Followers list — visible to any signed-in viewer. Per D-21 a target's
// `privacy_mode` no longer hides this list; it only governs follow approval.
// FR-PROFILE-009 / FR-PROFILE-010. Each row carries dynamic Follow + ⋮ "Remove follower" if self.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { User } from '@kc/domain';
import { AvatarInitials } from '../../../src/components/AvatarInitials';
import { ConfirmActionModal } from '../../../src/components/post/ConfirmActionModal';
import { useAuthStore } from '../../../src/store/authStore';
import { getUserRepo } from '../../../src/services/userComposition';
import {
  getListFollowersUseCase,
  getRemoveFollowerUseCase,
} from '../../../src/services/followComposition';

export default function FollowersListScreen() {
  const { t } = useTranslation();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [pendingRemove, setPendingRemove] = React.useState<User | null>(null);
  const [busyRemove, setBusyRemove] = React.useState(false);

  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const owner = userQuery.data;
  const isMe = me === owner?.userId;

  const followersQuery = useQuery({
    queryKey: ['followers', owner?.userId],
    queryFn: () => getListFollowersUseCase().execute({ userId: owner!.userId, limit: 50 }),
    enabled: Boolean(owner?.userId),
  });

  if (!owner) {
    return <SafeAreaView style={styles.container} edges={['bottom']}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }

  const filtered = (followersQuery.data?.users ?? []).filter((u) =>
    !search || u.displayName.toLowerCase().startsWith(search.toLowerCase()),
  );

  const confirmRemove = async () => {
    if (!me || !isMe || !pendingRemove) return;
    setBusyRemove(true);
    try {
      await getRemoveFollowerUseCase().execute({ ownerId: me, followerId: pendingRemove.userId });
      qc.invalidateQueries({ queryKey: ['followers', me] });
      qc.invalidateQueries({ queryKey: ['user-profile', me] });
      setPendingRemove(null);
    } finally {
      setBusyRemove(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerTitle: t('profile.followersScreen.headerTitle') }} />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('profile.followersScreen.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {followersQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>{t('profile.followersScreen.empty')}</Text>
      ) : (
        filtered.map((u) => (
          <TouchableOpacity
            key={u.userId}
            style={styles.row}
            onPress={() => router.push({ pathname: '/user/[handle]', params: { handle: u.shareHandle } })}
          >
            <AvatarInitials name={u.displayName} avatarUrl={u.avatarUrl} size={44} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{u.displayName}</Text>
              <Text style={styles.city}>{u.cityName}</Text>
            </View>
            {isMe ? (
              <TouchableOpacity onPress={() => setPendingRemove(u)} style={styles.menuBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        ))
      )}
      <ConfirmActionModal
        visible={pendingRemove !== null}
        title={t('profile.followersScreen.removeFollowerTitle')}
        message={pendingRemove
          ? t('profile.followersScreen.removeFollowerMessage', { name: pendingRemove.displayName })
          : ''}
        confirmLabel={t('profile.followersScreen.removeFollowerConfirm')}
        destructive
        isBusy={busyRemove}
        onCancel={() => (busyRemove ? null : setPendingRemove(null))}
        onConfirm={confirmRemove}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, margin: spacing.base, padding: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  name: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  city: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  menuBtn: { padding: spacing.xs },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
