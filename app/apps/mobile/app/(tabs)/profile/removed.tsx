// My Profile — "הוסרו" tab (posts removed by admin). Sibling route: ./index.tsx, ./closed.tsx.
// Mapped to: FR-POST-008 edge-case (owner sees removed_admin posts), TD-131.
// RLS allows this: is_post_visible_to() returns true when owner_id = viewer.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '@kc/ui';
import { MyProfileChrome } from '../../../src/components/profile/MyProfileChrome';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { useAuthStore } from '../../../src/store/authStore';
import { getMyPostsUseCase } from '../../../src/services/postsComposition';

export default function MyProfileRemovedScreen() {
  const userId = useAuthStore((s) => s.session?.userId);

  const removedPostsQuery = useQuery({
    queryKey: ['my-removed-posts', userId],
    queryFn: () =>
      getMyPostsUseCase().execute({
        userId: userId!,
        status: ['removed_admin'],
        limit: 30,
      }),
    enabled: Boolean(userId),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MyProfileChrome activeTab="removed" />
        <View style={styles.banner}>
          <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.bannerText}>
            פוסטים אלה הוסרו על ידי מנהל הקהילה. הם גלויים רק לך.
          </Text>
        </View>
        <ProfilePostsGrid
          posts={removedPostsQuery.data?.posts ?? []}
          isLoading={removedPostsQuery.isLoading}
          empty="self_open"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  bannerText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
});
