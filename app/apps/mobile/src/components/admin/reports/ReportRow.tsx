// app/apps/mobile/src/components/admin/reports/ReportRow.tsx
// FR-ADMIN-012 — single inbox row showing target preview + threshold + age.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReportInboxRow } from '@kc/domain';
import { thresholdProgress } from '@kc/domain';
import he from '../../../i18n/locales/he';

export interface ReportRowProps {
  readonly row: ReportInboxRow;
}

function ageLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return he.admin.reports.row.ageMinutes(mins);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return he.admin.reports.row.ageHours(hrs);
  const days = Math.floor(hrs / 24);
  return he.admin.reports.row.ageDays(days);
}

function preview(row: ReportInboxRow): string {
  const t = row.target;
  if (typeof t['preview'] === 'string') return t['preview'];
  if (typeof t['display_name'] === 'string') return t['display_name'];
  return `${row.targetType}:${row.targetId.slice(0, 8)}`;
}

export function ReportRow({ row }: ReportRowProps) {
  const progress = thresholdProgress(row.reporterCount);
  const caseId = encodeURIComponent(`${row.targetType}:${row.targetId}`);
  return (
    <Pressable
      style={styles.root}
      onPress={() =>
        router.push({
          pathname: '/(admin)/reports/[caseId]',
          params: { caseId },
        })
      }
    >
      <Text style={styles.preview} numberOfLines={2}>{preview(row)}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {he.admin.reports.row.thresholdLabel(progress.count, progress.threshold)}
        </Text>
        <Text style={styles.metaText}>{ageLabel(row.oldestAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:      { padding: 16, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  preview:   { fontSize: 14, fontWeight: '500' },
  meta:      { flexDirection: 'row', gap: 12 },
  metaText:  { fontSize: 12, opacity: 0.6 },
});
