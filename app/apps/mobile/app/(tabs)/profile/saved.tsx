// My Profile — saved posts list, split into open and closed lanes
// mirroring /profile/hidden. Stack header from `profile/_layout.tsx`.
// Mapped to: FR-PROFILE-016, FR-POST-022.
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { useShellTabBarScrollInset } from '../../../src/navigation/useShellTabBarVisibility';
import { useAuthStore } from '../../../src/store/authStore';
import { getListSavedPostsUseCase } from '../../../src/services/savedPostsComposition';

export default function MyProfileSavedScreen() {
  const styles = useStyles();
  const tabBarPad = useShellTabBarScrollInset();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.userId);

  const savedPostsQuery = useQuery({
    queryKey: ['saved-posts', userId],
    queryFn: () => getListSavedPostsUseCase().execute({ limit: 30 }),
    enabled: Boolean(userId),
  });

  const { openPosts, closedPosts } = useMemo(() => {
    const all = savedPostsQuery.data?.posts ?? [];
    return {
      openPosts: all.filter((p) => p.status === 'open'),
      closedPosts: all.filter(
        (p) => p.status === 'closed_delivered' || p.status === 'deleted_no_recipient',
      ),
    };
  }, [savedPostsQuery.data?.posts]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: spacing.base + tabBarPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Ionicons name="bookmark-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.bannerText}>{t('profile.savedBanner')}</Text>
        </View>
        <Text style={styles.sectionTitle}>{t('profile.savedSectionOpen')}</Text>
        <ProfilePostsGrid
          posts={openPosts}
          isLoading={savedPostsQuery.isLoading}
          empty="self_saved_open"
        />
        <Text style={styles.sectionTitle}>{t('profile.savedSectionClosed')}</Text>
        <ProfilePostsGrid
          posts={closedPosts}
          isLoading={savedPostsQuery.isLoading}
          empty="self_saved_closed"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeUseStyles(({ colors, isDark }) => ({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, width: '100%', alignSelf: 'stretch' as const },
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,

    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent',
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
}));
