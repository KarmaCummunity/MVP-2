// app/apps/mobile/src/components/admin/reports/ReportFilters.tsx
// FR-ADMIN-012 — chip-based target/age filters + reporter-id search.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ListOpenReportsFilters } from '@kc/application';
import he from '../../../i18n/locales/he';

export interface ReportFiltersProps {
  readonly value: ListOpenReportsFilters;
  readonly onChange: (next: ListOpenReportsFilters) => void;
}

const TYPES: ReadonlyArray<{ readonly key: 'all' | 'post' | 'user' | 'chat'; readonly label: string }> = [
  { key: 'all',  label: he.admin.reports.filters.all },
  { key: 'post', label: he.admin.reports.filters.posts },
  { key: 'user', label: he.admin.reports.filters.users },
  { key: 'chat', label: he.admin.reports.filters.chats },
];

export function ReportFilters({ value, onChange }: ReportFiltersProps) {
  const [reporter, setReporter] = useState(value.reporterId ?? '');

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPES.map((t) => {
          const active = (value.targetType ?? null) === (t.key === 'all' ? null : t.key);
          return (
            <Pressable
              key={t.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() =>
                onChange({ ...value, targetType: t.key === 'all' ? null : t.key })
              }
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, value.maxAgeDays === 7 && styles.chipActive]}
          onPress={() => onChange({ ...value, maxAgeDays: value.maxAgeDays === 7 ? null : 7 })}
        >
          <Text style={styles.chipText}>{he.admin.reports.filters.last7Days}</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, value.maxAgeDays === 30 && styles.chipActive]}
          onPress={() => onChange({ ...value, maxAgeDays: value.maxAgeDays === 30 ? null : 30 })}
        >
          <Text style={styles.chipText}>{he.admin.reports.filters.last30Days}</Text>
        </Pressable>
      </ScrollView>
      <TextInput
        style={styles.search}
        placeholder={he.admin.reports.filters.search}
        value={reporter}
        onChangeText={setReporter}
        onSubmitEditing={() => onChange({ ...value, reporterId: reporter || null })}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { gap: 8, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  row:            { gap: 8, paddingRight: 12 },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f5f5f5' },
  chipActive:     { backgroundColor: '#eef2ff' },
  chipText:       { fontSize: 12 },
  chipTextActive: { fontWeight: '600' },
  search:         { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 8, fontSize: 14 },
});
