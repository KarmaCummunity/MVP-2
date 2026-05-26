// app/apps/mobile/app/(admin)/index.tsx
import type { ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AdminRole } from '@kc/domain';
import { useAdminRoles } from '../../src/hooks/useAdminRoles';
import he from '../../src/i18n/locales/he';

const ROLE_LABELS: Readonly<Record<AdminRole, string>> = he.admin.roles;

export default function AdminDashboard(): ReactElement {
  const roles = useAdminRoles();
  const t = he.admin.dashboard;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{t.welcome}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.rolesLabel}</Text>
        <View style={styles.badges}>
          {roles.map((role) => (
            <View key={role} style={styles.badge}>
              <Text style={styles.badgeText}>
                {ROLE_LABELS[role] ?? role}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.kpis}>
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>{t.openReportsKpi}</Text>
          <Text style={styles.kpiValue}>{t.comingSoonKpi}</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>{t.openTasksKpi}</Text>
          <Text style={styles.kpiValue}>{t.comingSoonKpi}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { padding: 20, gap: 20 },
  title:        { fontSize: 20, fontWeight: '700' },
  section:      { gap: 8 },
  sectionTitle: { fontSize: 14, opacity: 0.7 },
  badges:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge:        { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  kpis:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi:          { flexBasis: 160, padding: 16, backgroundColor: '#fafafa', borderRadius: 12, gap: 6 },
  kpiLabel:     { fontSize: 12, opacity: 0.7 },
  kpiValue:     { fontSize: 18, fontWeight: '600' },
});
