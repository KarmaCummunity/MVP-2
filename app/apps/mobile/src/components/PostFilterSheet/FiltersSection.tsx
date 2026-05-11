import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type Category,
  type FeedStatusFilter,
  type ItemCondition,
  type PostType,
} from '@kc/domain';
import { colors, spacing, typography } from '@kc/ui';
import { Chip } from './Chip';

interface FiltersSectionProps {
  type: PostType | null;
  categories: Category[];
  itemConditions: ItemCondition[];
  statusFilter: FeedStatusFilter;
  followersOnly: boolean;
  onTypeChange: (t: PostType | null) => void;
  onCategoriesChange: (c: Category[]) => void;
  onItemConditionsChange: (i: ItemCondition[]) => void;
  onStatusFilterChange: (s: FeedStatusFilter) => void;
  onFollowersOnlyChange: (v: boolean) => void;
}

const TYPE_LABELS: Record<'all' | PostType, string> = {
  all: 'הכל',
  Give: '🎁 נתינה',
  Request: '🔍 בקשה',
};

const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  New: 'חדש',
  LikeNew: 'כמו חדש',
  Good: 'טוב',
  Fair: 'סביר',
};

const STATUS_LABELS: Record<FeedStatusFilter, string> = {
  all: 'הכל',
  open: 'רק פתוחים',
  closed: 'רק סגורים',
};

const ITEM_CONDITIONS: ItemCondition[] = ['New', 'LikeNew', 'Good', 'Fair'];

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function FiltersSection({
  type,
  categories,
  itemConditions,
  statusFilter,
  followersOnly,
  onTypeChange,
  onCategoriesChange,
  onItemConditionsChange,
  onStatusFilterChange,
  onFollowersOnlyChange,
}: FiltersSectionProps) {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.title}>סוג פוסט</Text>
        <View style={styles.row}>
          <Chip label={TYPE_LABELS.all} active={type === null} onPress={() => onTypeChange(null)} />
          <Chip label={TYPE_LABELS.Give} active={type === 'Give'} onPress={() => onTypeChange('Give')} />
          <Chip label={TYPE_LABELS.Request} active={type === 'Request'} onPress={() => onTypeChange('Request')} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>קטגוריה</Text>
        <View style={styles.row}>
          <Chip
            label="הכל"
            active={categories.length === 0}
            onPress={() => onCategoriesChange([])}
          />
          {ALL_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c]}
              active={categories.includes(c)}
              onPress={() => onCategoriesChange(toggleInArray(categories, c))}
            />
          ))}
        </View>
      </View>

      {type === 'Give' && (
        <View style={styles.section}>
          <Text style={styles.title}>מצב המוצר</Text>
          <View style={styles.row}>
            <Chip
              label="הכל"
              active={itemConditions.length === 0}
              onPress={() => onItemConditionsChange([])}
            />
            {ITEM_CONDITIONS.map((i) => (
              <Chip
                key={i}
                label={ITEM_CONDITION_LABELS[i]}
                active={itemConditions.includes(i)}
                onPress={() => onItemConditionsChange(toggleInArray(itemConditions, i))}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.title}>סטטוס פוסט</Text>
        <View style={styles.row}>
          {(['all', 'open', 'closed'] as FeedStatusFilter[]).map((s) => (
            <Chip
              key={s}
              label={STATUS_LABELS[s]}
              active={statusFilter === s}
              onPress={() => onStatusFilterChange(s)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>מקור הפוסטים</Text>
        <View style={styles.row}>
          <Chip
            label="הכל"
            active={!followersOnly}
            onPress={() => onFollowersOnlyChange(false)}
          />
          <Chip
            label="👥 רק ממי שאני עוקב"
            active={followersOnly}
            onPress={() => onFollowersOnlyChange(true)}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
});
