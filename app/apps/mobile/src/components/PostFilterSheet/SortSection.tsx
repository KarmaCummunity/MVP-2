import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

const SORT_LABELS: Record<FeedSortOrder, string> = {
  newest: '🆕 חדש קודם',
  oldest: '🕓 ישן קודם',
  distance: '📍 לפי מיקום',
};

const SORT_ORDER_ENTRIES: FeedSortOrder[] = ['newest', 'oldest', 'distance'];

export function SortSection({
  sortOrder,
  proximitySortCity,
  onSortOrderChange,
  onProximitySortCityChange,
}: SortSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>מיון</Text>
      <View style={styles.row}>
        {SORT_ORDER_ENTRIES.map((s) => (
          <Chip
            key={s}
            label={SORT_LABELS[s]}
            active={sortOrder === s}
            onPress={() => onSortOrderChange(s)}
          />
        ))}
      </View>
      {sortOrder === 'distance' && (
        <View style={styles.cityWrap}>
          <Text style={styles.subLabel}>מרכז המיון (ברירת מחדל: העיר שלך)</Text>
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
