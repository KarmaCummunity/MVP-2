// app/apps/mobile/src/components/admin/reports/ReportFilters.tsx
// FR-ADMIN-012 — chip-based target/age filters + reporter-id search, rendered
// through the shared AdminListControls so the reports inbox matches every other
// Admin Portal sub-screen on mobile.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ListOpenReportsFilters } from '@kc/application';
import { makeUseStyles } from '@kc/ui';
import { AdminListControls } from '../AdminListControls';
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
      <AdminListControls
        search={{
          value: reporter,
          onChangeText: setReporter,
          placeholder: he.admin.reports.filters.search,
          onSubmit: () => onChange({ ...value, reporterId: reporter || null }),
        }}
        filterGroups={[{
          key: 'target',
          options: [
            ...TYPES.map((t) => ({
              key: t.key,
              label: t.label,
              active: (value.targetType ?? null) === (t.key === 'all' ? null : t.key),
              onPress: () => onChange({ ...value, targetType: t.key === 'all' ? null : t.key }),
            })),
            {
              key: 'last7',
              label: he.admin.reports.filters.last7Days,
              active: value.maxAgeDays === 7,
              onPress: () => onChange({ ...value, maxAgeDays: value.maxAgeDays === 7 ? null : 7 }),
            },
            {
              key: 'last30',
              label: he.admin.reports.filters.last30Days,
              active: value.maxAgeDays === 30,
              onPress: () => onChange({ ...value, maxAgeDays: value.maxAgeDays === 30 ? null : 30 }),
            },
          ],
        }]}
      />
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root: { paddingTop: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
}));
