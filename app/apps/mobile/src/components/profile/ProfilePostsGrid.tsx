// app/apps/mobile/src/components/profile/ProfilePostsGrid.tsx
// Posts grid + loader + empty state. Used by both profile screens.
// Mapped to: FR-PROFILE-001 AC4, FR-PROFILE-002 AC3.

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@kc/ui';
import type { Post } from '@kc/domain';
import { PostCardProfile } from '../PostCardProfile';
import { EmptyState } from '../EmptyState';

export type EmptyVariant =
  | 'self_open'
  | 'self_closed'
  | 'self_saved'
  | 'self_hidden_open'
  | 'other_open'
  | 'other_closed';

export interface ProfilePostsGridProps {
  posts: Post[];
  isLoading: boolean;
  empty: EmptyVariant;
}

export function ProfilePostsGrid({ posts, isLoading, empty }: ProfilePostsGridProps) {
  const { t } = useTranslation();
  const EMPTY_COPY: Record<EmptyVariant, { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = {
    self_open: {
      title: t('profile.emptyOpenTitle'),
      subtitle: t('profile.emptySelfOpenSubtitle'),
      icon: 'mail-open-outline',
    },
    self_closed: {
      title: t('profile.emptyClosedTitleSelf'),
      subtitle: t('profile.emptySelfClosedSubtitleLegacy'),
      icon: 'archive-outline',
    },
    self_saved: {
      title: t('profile.emptySavedTitle'),
      subtitle: t('profile.emptySavedSubtitle'),
      icon: 'bookmark-outline',
    },
    self_hidden_open: {
      title: t('profile.emptyHiddenOpenTitle'),
      subtitle: t('profile.emptyHiddenOpenSubtitle'),
      icon: 'eye-off-outline',
    },
    other_open: {
      title: t('profile.emptyOpenTitle'),
      subtitle: t('profile.emptyOtherOpenSubtitle'),
      icon: 'mail-open-outline',
    },
    other_closed: {
      title: t('profile.emptyClosedTitle'),
      subtitle: t('profile.emptyOtherClosedSubtitleLegacy'),
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
  if (posts.length === 0) {
    const e = EMPTY_COPY[empty];
    return <EmptyState icon={e.icon} title={e.title} subtitle={e.subtitle} />;
  }
  return (
    <View style={styles.grid}>
      {posts.map((p) => <PostCardProfile key={p.postId} post={p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.xs },
});
