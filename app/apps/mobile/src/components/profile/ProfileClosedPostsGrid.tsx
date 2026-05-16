// app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx
// Grid + loader + empty state for the closed-posts tab.
// Mapped to: FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised).

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@kc/ui';
import type { ProfileClosedPostsItem } from '@kc/domain';
import { PostCardProfile } from '../PostCardProfile';
import { EmptyState } from '../EmptyState';

export type ClosedEmptyVariant = 'self_closed' | 'self_hidden_closed' | 'other_closed';

export interface ProfileClosedPostsGridProps {
  items: ProfileClosedPostsItem[];
  isLoading: boolean;
  empty: ClosedEmptyVariant;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** Profile whose closed-posts tab is shown — forwarded to post detail for D-31 identity projection. */
  profileUserId: string;
}

export function ProfileClosedPostsGrid({
  items,
  isLoading,
  empty,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  profileUserId,
}: ProfileClosedPostsGridProps) {
  const { t } = useTranslation();
  const EMPTY_COPY: Record<ClosedEmptyVariant, {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = {
    self_closed: {
      title: t('profile.emptyClosedTitleSelf'),
      subtitle: t('profile.emptySelfClosedSubtitle'),
      icon: 'archive-outline',
    },
    self_hidden_closed: {
      title: t('profile.emptyHiddenClosedTitle'),
      subtitle: t('profile.emptyHiddenClosedSubtitle'),
      icon: 'eye-off-outline',
    },
    other_closed: {
      title: t('profile.emptyClosedTitle'),
      subtitle: t('profile.emptyOtherClosedSubtitle'),
      icon: 'archive-outline',
    },
  };
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (items.length === 0) {
    const e = EMPTY_COPY[empty];
    return <EmptyState icon={e.icon} title={e.title} subtitle={e.subtitle} />;
  }
  return (
    <>
      <View style={styles.grid}>
        {items.map(({ post, identityRole }) => (
          <PostCardProfile
            key={post.postId}
            post={post}
            identityRole={identityRole}
            closedPostsProfileUserId={profileUserId}
          />
        ))}
      </View>
      {hasMore && onLoadMore ? (
        <View style={styles.loadMoreRow}>
          <TouchableOpacity
            style={[styles.loadMoreBtn, isLoadingMore && styles.loadMoreBtnBusy]}
            onPress={onLoadMore}
            disabled={isLoadingMore}
            accessibilityRole="button"
          >
            {isLoadingMore ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.loadMoreText}>{t('feed.loadMore')}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.xs },
  loadMoreRow: { paddingVertical: spacing.lg, alignItems: 'center' },
  loadMoreBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 140,
    alignItems: 'center',
  },
  loadMoreBtnBusy: { opacity: 0.6 },
  loadMoreText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
