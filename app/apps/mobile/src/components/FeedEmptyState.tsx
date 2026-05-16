// FeedEmptyState — warm empty state for the Home Feed (FR-FEED-008).
// CTAs adapt to whether filters caused the emptiness.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import { FeedCommunityCounter } from './FeedCommunityCounter';

interface FeedEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onShare: () => void;
}

export function FeedEmptyState({
  hasActiveFilters,
  onClearFilters,
  onShare,
}: FeedEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Ionicons name="archive-outline" size={56} color={colors.textDisabled} />
      <Text style={styles.title}>
        {hasActiveFilters ? t('feed.emptyFiltered') : t('feed.empty')}
      </Text>
      <Text style={styles.body}>
        {hasActiveFilters ? t('feed.emptyFilteredDesc') : t('feed.emptyDesc')}
      </Text>
      <FeedCommunityCounter
        template={(n) => t('feed.activeInCommunityWithCount', { count: n })}
      />
      <View style={styles.actions}>
        {hasActiveFilters && (
          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onClearFilters}>
            <Text style={styles.btnTextSecondary}>{t('feed.clearFilters')}</Text>
          </Pressable>
        )}
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onShare}>
          <Text style={styles.btnTextPrimary}>{t('feed.sharePost')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.base },
  btn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  btnTextPrimary: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
  btnTextSecondary: { ...typography.body, color: colors.textPrimary, fontWeight: '700' as const },
});
