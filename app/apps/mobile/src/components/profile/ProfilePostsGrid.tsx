// app/apps/mobile/src/components/profile/ProfilePostsGrid.tsx
// Posts grid + loader + empty state. Used by both profile screens.
// Mapped to: FR-PROFILE-001 AC4, FR-PROFILE-002 AC3.

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, useTheme } from '@kc/ui';
import type { Post } from '@kc/domain';
import { chunkArray } from '../../lib/chunkArray';
import { PostCardProfile } from '../PostCardProfile';
import { EmptyState } from '../EmptyState';

export type EmptyVariant =
  | 'self_open'
  | 'self_closed'
  | 'self_saved_open'
  | 'self_saved_closed'
  | 'self_hidden_open'
  | 'self_removed_open'
  | 'self_removed_closed'
  | 'other_open'
  | 'other_closed';

export interface ProfilePostsGridProps {
  posts: Post[];
  isLoading: boolean;
  empty: EmptyVariant;
}

export function ProfilePostsGrid({ posts, isLoading, empty }: ProfilePostsGridProps) {
  const styles = useStyles();
  const { colors } = useTheme();
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
    self_saved_open: {
      title: t('profile.emptySavedOpenTitle'),
      subtitle: t('profile.emptySavedOpenSubtitle'),
      icon: 'bookmark-outline',
    },
    self_saved_closed: {
      title: t('profile.emptySavedClosedTitle'),
      subtitle: t('profile.emptySavedClosedSubtitle'),
      icon: 'bookmark-outline',
    },
    self_hidden_open: {
      title: t('profile.emptyHiddenOpenTitle'),
      subtitle: t('profile.emptyHiddenOpenSubtitle'),
      icon: 'eye-off-outline',
    },
    self_removed_open: {
      title: t('profile.emptyRemovedOpenTitle'),
      subtitle: t('profile.emptyRemovedOpenSubtitle'),
      icon: 'shield-outline',
    },
    self_removed_closed: {
      title: t('profile.emptyRemovedClosedTitle'),
      subtitle: t('profile.emptyRemovedClosedSubtitle'),
      icon: 'shield-outline',
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
      {chunkArray(posts, 3).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((p) => (
            <PostCardProfile key={p.postId} post={p} />
          ))}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors, isDark }) => ({
  loading: { padding: spacing.xl, alignItems: 'center' },
  grid: {
    width: '100%',
    alignSelf: 'stretch' as const,
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
    width: '100%',
    alignSelf: 'stretch' as const,
  },
}));
