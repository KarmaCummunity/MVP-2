import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FeedSortOrder } from '@kc/domain';
import { colors, spacing, typography } from '@kc/ui';
import { Chip } from './Chip';
import { CityPicker } from '../CityPicker';

interface SortSectionProps {
  sortOrder: FeedSortOrder;
  proximitySortCity: { id: string; name: string } | null;
  onSortOrderChange: (s: FeedSortOrder) => void;
  onProximitySortCityChange: (c: { id: string; name: string } | null) => void;
}

const SORT_KEYS: Record<FeedSortOrder, string> = {
  newest: 'filters.sortNewest',
  oldest: 'filters.sortOldest',
  distance: 'filters.sortDistance',
};

const SORT_ORDER_ENTRIES: FeedSortOrder[] = ['newest', 'oldest', 'distance'];

export function SortSection({
  sortOrder,
  proximitySortCity,
  onSortOrderChange,
  onProximitySortCityChange,
}: SortSectionProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('filters.sectionSort')}</Text>
      <View style={styles.row}>
        {SORT_ORDER_ENTRIES.map((s) => (
          <Chip
            key={s}
            label={t(SORT_KEYS[s])}
            active={sortOrder === s}
            onPress={() => onSortOrderChange(s)}
          />
        ))}
      </View>
      {sortOrder === 'distance' && (
        <View style={styles.cityWrap}>
          <Text style={styles.subLabel}>{t('filters.sortDistanceCenterHint')}</Text>
          <CityPicker value={proximitySortCity} onChange={onProximitySortCityChange} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  subLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
  cityWrap: { gap: spacing.xs, marginTop: spacing.sm },
});
