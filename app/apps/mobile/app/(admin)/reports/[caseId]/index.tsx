// app/apps/mobile/app/(admin)/reports/[caseId]/index.tsx
// FR-ADMIN-013 — case detail screen.
// caseId encodes "<target_type>:<target_id>" (URL-encoded). The same encoding
// is the routing contract for deep-links (e.g. from chat ReportReceivedBubble
// or future notification taps).
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AdminReportTargetType } from '@kc/domain';
import { useReportCaseDetail } from '../../../../src/hooks/useReportCaseDetail';
import { CaseReporterList } from '../../../../src/components/admin/reports/CaseReporterList';
import { CaseAuditTimeline } from '../../../../src/components/admin/reports/CaseAuditTimeline';
import { CaseActions } from '../../../../src/components/admin/reports/CaseActions';
import he from '../../../../src/i18n/locales/he';

function parseCaseId(
  raw: string | undefined,
): { type: AdminReportTargetType; id: string } | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  // Target IDs can themselves contain ':' so split on the first one only.
  const idx = decoded.indexOf(':');
  if (idx <= 0) return null;
  const type = decoded.slice(0, idx);
  const id = decoded.slice(idx + 1);
  if (!id) return null;
  if (type !== 'post' && type !== 'user' && type !== 'chat') return null;
  return { type, id };
}

export default function CaseDetail() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const parsed = parseCaseId(caseId);
  const { data, isLoading, refetch } = useReportCaseDetail(
    parsed?.type ?? null,
    parsed?.id ?? null,
  );

  if (!parsed) {
    return (
      <View style={styles.center}>
        <Text>{he.admin.caseDetail.notFound}</Text>
      </View>
    );
  }
  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>{he.admin.caseDetail.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{he.admin.caseDetail.title}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.targetSection}</Text>
        <View style={styles.targetBox}>
          {Object.entries(data.target).map(([k, v]) => (
            <Text key={k} style={styles.kv}>{k}: {String(v)}</Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.actions}</Text>
        <CaseActions detail={data} onActed={() => { void refetch(); }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.reporters}</Text>
        <CaseReporterList reporters={data.reporters} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.timeline}</Text>
        <CaseAuditTimeline entries={data.timeline} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { padding: 16, gap: 16 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title:        { fontSize: 20, fontWeight: '700' },
  section:      { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  targetBox:    { padding: 12, backgroundColor: '#fafafa', borderRadius: 8, gap: 4 },
  kv:           { fontSize: 13 },
});
