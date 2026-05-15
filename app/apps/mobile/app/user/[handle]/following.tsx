// app/apps/mobile/app/user/[handle]/following.tsx
// Following list — visible to any signed-in viewer. Per D-21 a target's
// `privacy_mode` no longer hides this list; it only governs follow approval.
// FR-PROFILE-010.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { AvatarInitials } from '../../../src/components/AvatarInitials';
import { getUserRepo } from '../../../src/services/userComposition';
import { getListFollowingUseCase } from '../../../src/services/followComposition';

export default function FollowingListScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const owner = userQuery.data;

  const followingQuery = useQuery({
    queryKey: ['following', owner?.userId],
    queryFn: () => getListFollowingUseCase().execute({ userId: owner!.userId, limit: 50 }),
    enabled: Boolean(owner?.userId),
  });

  if (!owner) {
    return <SafeAreaView style={styles.container} edges={['bottom']}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }

  const filtered = (followingQuery.data?.users ?? []).filter((u) =>
    !search || u.displayName.toLowerCase().startsWith(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerTitle: 'נעקבים' }} />
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
      {followingQuery.isLoading ? (
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
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
});
