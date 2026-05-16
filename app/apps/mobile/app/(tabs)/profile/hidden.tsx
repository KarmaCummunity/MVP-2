// My Profile — OnlyMe (hidden) posts. Stack header + title from `profile/_layout.tsx`.
// Mapped to: FR-PROFILE-001 AC4 (Hidden overflow entry).
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '@kc/ui';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { ProfileClosedPostsGrid } from '../../../src/components/profile/ProfileClosedPostsGrid';
import { useAuthStore } from '../../../src/store/authStore';
import { getMyPostsUseCase } from '../../../src/services/postsComposition';
import { useProfileClosedPosts } from '../../../src/hooks/useProfileClosedPosts';

export default function MyProfileHiddenScreen() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.userId);

  const hiddenOpenQuery = useQuery({
    queryKey: ['my-hidden-open-posts', userId],
    queryFn: () =>
      getMyPostsUseCase().execute({
        userId: userId!,
        status: ['open'],
        limit: 30,
        visibility: 'OnlyMe',
      }),
    enabled: Boolean(userId),
  });

  const hiddenClosed = useProfileClosedPosts({
    profileUserId: userId,
    viewerUserId: userId ?? null,
    listMode: 'owner_only_me',
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="eye-off-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.bannerText}>{t('profile.hiddenBanner')}</Text>
        </View>
        <Text style={styles.sectionTitle}>{t('profile.hiddenSectionOpen')}</Text>
        <ProfilePostsGrid
          posts={hiddenOpenQuery.data?.posts ?? []}
          isLoading={hiddenOpenQuery.isLoading}
          empty="self_hidden_open"
        />
        <Text style={styles.sectionTitle}>{t('profile.hiddenSectionClosed')}</Text>
        <ProfileClosedPostsGrid
          items={hiddenClosed.items}
          isLoading={hiddenClosed.isLoading}
          empty="self_hidden_closed"
          hasMore={hiddenClosed.hasMore}
          isLoadingMore={hiddenClosed.isLoadingMore}
          onLoadMore={hiddenClosed.loadMore}
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
    borderLeftColor: colors.textSecondary,
  },
  bannerText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  sectionTitle: {
    ...typography.semiBold,
    color: colors.textPrimary,
    textAlign: 'right',
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
