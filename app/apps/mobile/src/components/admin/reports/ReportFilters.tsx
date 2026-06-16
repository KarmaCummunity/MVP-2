// app/apps/mobile/src/components/admin/reports/ReportFilters.tsx
// FR-ADMIN-012 — chip-based target/age filters + reporter-id search.
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { ListOpenReportsFilters } from '@kc/application';
import { makeUseStyles } from '@kc/ui';
import { AdminFilterChip } from '../AdminFilterChip';
import { AdminFilterChipRow } from '../AdminFilterChipRow';
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
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <AdminFilterChipRow>
        {TYPES.map((t) => (
          <AdminFilterChip
            key={t.key}
            label={t.label}
            active={(value.targetType ?? null) === (t.key === 'all' ? null : t.key)}
            onPress={() => onChange({ ...value, targetType: t.key === 'all' ? null : t.key })}
          />
        ))}
        <AdminFilterChip
          label={he.admin.reports.filters.last7Days}
          active={value.maxAgeDays === 7}
          onPress={() => onChange({ ...value, maxAgeDays: value.maxAgeDays === 7 ? null : 7 })}
        />
        <AdminFilterChip
          label={he.admin.reports.filters.last30Days}
          active={value.maxAgeDays === 30}
          onPress={() => onChange({ ...value, maxAgeDays: value.maxAgeDays === 30 ? null : 30 })}
        />
      </AdminFilterChipRow>
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

const useStyles = makeUseStyles(({ colors }) => ({
  root:   { gap: 8, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  search: {
    marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, fontSize: 14,
  },
}));
