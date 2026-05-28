// app/apps/mobile/src/components/admin/reports/CaseReporterList.tsx
// FR-ADMIN-013 — list of reporters attached to a case (name, status, reason, note, time).
import { Text, View } from 'react-native';
import type { ReportCaseReporter } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';

export interface CaseReporterListProps {
  readonly reporters: readonly ReportCaseReporter[];
}

export function CaseReporterList({ reporters }: CaseReporterListProps) {
  const styles = useStyles();
  if (reporters.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>—</Text>
      </View>
    );
  }
  return (
    <View style={styles.list}>
      {reporters.map((r) => (
        <View key={r.reportId} style={styles.item}>
          <View style={styles.head}>
            <Text style={styles.name}>{r.reporterName ?? r.reporterId.slice(0, 8)}</Text>
            <Text style={styles.status}>{r.status}</Text>
          </View>
          <Text style={styles.reason}>{r.reason}</Text>
          {r.note ? <Text style={styles.note}>{r.note}</Text> : null}
          <Text style={styles.time}>{new Date(r.createdAt).toLocaleString('he-IL')}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  list:      { gap: 12 },
  item:      { padding: 12, borderRadius: 8, backgroundColor: colors.skeleton, gap: 4 },
  head:      { flexDirection: 'row', justifyContent: 'space-between' },
  name:      { fontSize: 14, fontWeight: '600' },
  status:    { fontSize: 12, opacity: 0.6 },
  reason:    { fontSize: 14 },
  note:      { fontSize: 13, opacity: 0.7 },
  time:      { fontSize: 11, opacity: 0.5 },
  empty:     { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, opacity: 0.5 },
}));
