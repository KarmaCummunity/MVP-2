// app/apps/mobile/app/(admin)/index.tsx
import type { ReactElement } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { AdminRole } from '@kc/domain';
import { hasPermission } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../src/hooks/useAdminRoles';
import { useAdminsList } from '../../src/hooks/useAdminsList';
import { useAdminTasksList } from '../../src/hooks/useAdminTasks';
import { useReportsInbox } from '../../src/hooks/useReportsInbox';
import he from '../../src/i18n/locales/he';

const ROLE_LABELS: Readonly<Record<AdminRole, string>> = he.admin.roles;
const NAV_LABELS = he.admin.nav;

export default function AdminDashboard(): ReactElement {
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const t = he.admin.dashboard;
  const router = useRouter();
  const styles = useStyles();

  const inbox = useReportsInbox({});
  const firstPage = inbox.data?.pages[0];
  const reportsLabel = firstPage
    ? `${firstPage.rows.length}${firstPage.nextCursor ? '+' : ''}`
    : t.noCount;

  const tasksQuery = useAdminTasksList({});
  const openTasksLabel = tasksQuery.isLoading
    ? t.noCount
    : String(
        tasksQuery.tasks.filter(
          (task) => task.status === 'open' || task.status === 'in_progress',
        ).length,
      );

  const canViewAdmins = hasPermission(roles, 'admins.view');
  const canSearchUsers = hasPermission(roles, 'users.search');
  const canSearchPosts = hasPermission(roles, 'posts.search');
  const canViewAudit = hasPermission(roles, 'audit.view_own');

  const adminsQuery = useAdminsList(false, !rolesLoading && canViewAdmins);
  const adminsLabel = !canViewAdmins
    ? t.noCount
    : adminsQuery.isLoading
      ? t.noCount
      : String(adminsQuery.grants.length);

  const goTo = (path: string): void => {
    router.push(path as never);
  };

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.quickLinksTitle}</Text>
        <View style={styles.kpis}>
          <Pressable
            style={styles.kpi}
            onPress={() => goTo('/(admin)/reports')}
            accessibilityRole="button"
            accessibilityLabel={NAV_LABELS.reports}
          >
            <Text style={styles.kpiLabel}>{t.openReportsKpi}</Text>
            <Text style={styles.kpiValue}>{reportsLabel}</Text>
          </Pressable>

          <Pressable
            style={styles.kpi}
            onPress={() => goTo('/(admin)/tasks')}
            accessibilityRole="button"
            accessibilityLabel={NAV_LABELS.tasks}
          >
            <Text style={styles.kpiLabel}>{t.openTasksKpi}</Text>
            <Text style={styles.kpiValue}>{openTasksLabel}</Text>
          </Pressable>

          {canViewAdmins && (
            <Pressable
              style={styles.kpi}
              onPress={() => goTo('/(admin)/admins')}
              accessibilityRole="button"
              accessibilityLabel={NAV_LABELS.admins}
            >
              <Text style={styles.kpiLabel}>{t.adminsKpi}</Text>
              <Text style={styles.kpiValue}>{adminsLabel}</Text>
            </Pressable>
          )}

          {canSearchUsers && (
            <Pressable
              style={styles.kpi}
              onPress={() => goTo('/(admin)/users')}
              accessibilityRole="button"
              accessibilityLabel={NAV_LABELS.users}
            >
              <Text style={styles.kpiLabel}>{t.usersKpi}</Text>
              <Text style={styles.kpiValue}>{NAV_LABELS.users}</Text>
            </Pressable>
          )}

          {canSearchPosts && (
            <Pressable
              style={styles.kpi}
              onPress={() => goTo('/(admin)/posts')}
              accessibilityRole="button"
              accessibilityLabel={NAV_LABELS.posts}
            >
              <Text style={styles.kpiLabel}>{t.postsKpi}</Text>
              <Text style={styles.kpiValue}>{NAV_LABELS.posts}</Text>
            </Pressable>
          )}

          {canViewAudit && (
            <Pressable
              style={styles.kpi}
              onPress={() => goTo('/(admin)/audit')}
              accessibilityRole="button"
              accessibilityLabel={NAV_LABELS.audit}
            >
              <Text style={styles.kpiLabel}>{t.auditKpi}</Text>
              <Text style={styles.kpiValue}>{NAV_LABELS.audit}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:         { padding: 20, gap: 20 },
  title:        { fontSize: 20, fontWeight: '700' },
  section:      { gap: 8 },
  sectionTitle: { fontSize: 14, opacity: 0.7 },
  badges:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge:        { backgroundColor: colors.secondaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  kpis:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi:          { flexBasis: 160, padding: 16, backgroundColor: colors.skeleton, borderRadius: 12, gap: 6 },
  kpiLabel:     { fontSize: 12, opacity: 0.7 },
  kpiValue:     { fontSize: 18, fontWeight: '600' },
}));
