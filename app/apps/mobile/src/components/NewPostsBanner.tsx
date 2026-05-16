// NewPostsBanner — sticky "↑ N new posts" pill above the feed. Tap to
// refresh + scroll to top. Mapped to FR-FEED-009 AC2 (no silent injection
// into the user's scroll position).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';

interface NewPostsBannerProps {
  count: number;
  onPress: () => void;
}

export function NewPostsBanner({ count, onPress }: NewPostsBannerProps) {
  const { t } = useTranslation();
  if (count <= 0) return null;
  const label = count === 1 ? t('feed.newPostsOne') : t('feed.newPostsMany', { count });
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.pill} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        <Ionicons name="arrow-up" size={16} color={colors.textInverse} />
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  text: { ...typography.caption, color: colors.textInverse, fontWeight: '700' as const },
});
