// app/apps/mobile/app/user/[handle]/followers.tsx
// Followers list — accessible when target is Public, or self, or Private-approved follower.
// FR-PROFILE-009 / FR-PROFILE-010. Each row carries dynamic Follow + ⋮ "Remove follower" if self.

import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { User } from '@kc/domain';
import { AvatarInitials } from '../../../src/components/AvatarInitials';
import { LockedPanel } from '../../../src/components/profile/LockedPanel';
import { useAuthStore } from '../../../src/store/authStore';
import { getUserRepo } from '../../../src/services/userComposition';
import {
  getListFollowersUseCase,
  getRemoveFollowerUseCase,
  getGetFollowStateUseCase,
} from '../../../src/services/followComposition';

export default function FollowersListScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');

  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const owner = userQuery.data;
  const isMe = me === owner?.userId;

  const stateQuery = useQuery({
    queryKey: ['follow-state', me, owner?.userId],
    queryFn: () => getGetFollowStateUseCase().execute({ viewerId: me!, targetUserId: owner!.userId }),
    enabled: Boolean(me && owner?.userId && !isMe),
  });
  const allowed = isMe || owner?.privacyMode === 'Public' || stateQuery.data?.state === 'following';

  const followersQuery = useQuery({
    queryKey: ['followers', owner?.userId],
    queryFn: () => getListFollowersUseCase().execute({ userId: owner!.userId, limit: 50 }),
    enabled: Boolean(allowed && owner?.userId),
  });

  if (!owner) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }
  if (!allowed) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'עוקבים' }} />
        <LockedPanel />
      </SafeAreaView>
    );
  }

  const filtered = (followersQuery.data?.users ?? []).filter((u) =>
    !search || u.displayName.toLowerCase().startsWith(search.toLowerCase()),
  );

  const onRemove = (follower: User) => {
    if (!me || !isMe) return;
    Alert.alert(
      'להסיר עוקב?',
      `${follower.displayName} לא יראה יותר פוסטים שיועדו לעוקבים בלבד, ולא יקבל על כך הודעה. אם הפרופיל שלך פתוח הם יוכלו לעקוב מחדש מיד; אם הוא פרטי — יצטרכו לשלוח בקשה.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הסר',
          style: 'destructive',
          onPress: async () => {
            await getRemoveFollowerUseCase().execute({ ownerId: me, followerId: follower.userId });
            qc.invalidateQueries({ queryKey: ['followers', me] });
            qc.invalidateQueries({ queryKey: ['user-profile', me] });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'עוקבים' }} />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי שם"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {followersQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>אין תוצאות</Text>
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
              <TouchableOpacity onPress={() => onRemove(u)} style={styles.menuBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        ))
      )}
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
