// app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx
// Grid + loader + empty state for the "פוסטים סגורים" tab.
// Mapped to: FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised).

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@kc/ui';
import type { ProfileClosedPostsItem } from '@kc/domain';
import { PostCardProfile } from '../PostCardProfile';
import { EmptyState } from '../EmptyState';

export type ClosedEmptyVariant = 'self_closed' | 'other_closed';

export interface ProfileClosedPostsGridProps {
  items: ProfileClosedPostsItem[];
  isLoading: boolean;
  empty: ClosedEmptyVariant;
}

const EMPTY_COPY: Record<ClosedEmptyVariant, {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  self_closed: {
    title: 'אין פוסטים סגורים עדיין',
    subtitle: 'פוסטים שסגרת או שקיבלת יופיעו כאן.',
    icon: 'archive-outline',
  },
  other_closed: {
    title: 'אין פוסטים סגורים',
    subtitle: 'משתמש זה עוד לא סגר ולא קיבל פוסט.',
    icon: 'archive-outline',
  },
};

export function ProfileClosedPostsGrid({ items, isLoading, empty }: ProfileClosedPostsGridProps) {
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
    <View style={styles.grid}>
      {items.map(({ post, identityRole }) => (
        <PostCardProfile key={post.postId} post={post} identityRole={identityRole} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.xs },
});
