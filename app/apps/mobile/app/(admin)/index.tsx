// app/apps/mobile/app/(admin)/index.tsx
// FR-ADMIN-011 — admin dashboard. Welcome hero with role badges plus a
// responsive grid of stat / quick-link cards, RBAC-filtered per session.
import type { ComponentProps, ReactElement } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { AdminRole } from '@kc/domain';
import { hasPermission } from '@kc/domain';
import { makeUseStyles, shadow, useTheme } from '@kc/ui';
import { rowDirectionStart, textAlignStart } from '../../src/lib/rtlLayout';
import { useAdminRoles } from '../../src/hooks/useAdminRoles';
import { useAdminsList } from '../../src/hooks/useAdminsList';
import { useAdminTasksList } from '../../src/hooks/useAdminTasks';
import { useReportsInbox } from '../../src/hooks/useReportsInbox';
import he from '../../src/i18n/locales/he';

type IconName = ComponentProps<typeof Ionicons>['name'];
const ROLE_LABELS: Readonly<Record<AdminRole, string>> = he.admin.roles;

interface Card {
  key: string;
  label: string;
  value?: string;
  icon: IconName;
  accent: string;
  accentBg: string;
  href: string;
}

export default function AdminDashboard(): ReactElement {
  const { roles } = useAdminRoles();
  const t = he.admin.dashboard;
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();

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

  const adminsQuery = useAdminsList(false);
  const adminsLabel = !canViewAdmins || adminsQuery.isLoading
    ? t.noCount
    : String(adminsQuery.grants.length);

  const cards: Card[] = [
    { key: 'reports', label: t.openReportsKpi, value: reportsLabel, icon: 'flag-outline', accent: colors.error, accentBg: colors.errorLight, href: '/(admin)/reports' },
    { key: 'tasks', label: t.openTasksKpi, value: openTasksLabel, icon: 'checkbox-outline', accent: colors.info, accentBg: colors.infoLight, href: '/(admin)/tasks' },
  ];
  if (canViewAdmins) cards.push({ key: 'admins', label: t.adminsKpi, value: adminsLabel, icon: 'shield-checkmark-outline', accent: colors.secondary, accentBg: colors.secondaryLight, href: '/(admin)/admins' });
  if (canSearchUsers) cards.push({ key: 'users', label: t.usersKpi, icon: 'people-outline', accent: colors.success, accentBg: colors.successLight, href: '/(admin)/users' });
  if (canSearchPosts) cards.push({ key: 'posts', label: t.postsKpi, icon: 'document-text-outline', accent: colors.primary, accentBg: colors.primaryLight, href: '/(admin)/posts' });
  if (canViewAudit) cards.push({ key: 'audit', label: t.auditKpi, icon: 'time-outline', accent: colors.warning, accentBg: colors.warningLight, href: '/(admin)/audit' });

  const goTo = (path: string): void => router.push(path as never);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>{he.admin.portalTitle}</Text>
        <Text style={styles.heroTitle}>{t.welcome}</Text>
        <View style={styles.badges}>
          {roles.map((role) => (
            <View key={role} style={styles.badge}>
              <Text style={styles.badgeText}>{ROLE_LABELS[role] ?? role}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t.quickLinksTitle}</Text>
      <View style={styles.grid}>
        {cards.map((c) => (
          <Pressable
            key={c.key}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => goTo(c.href)}
            accessibilityRole="button"
            accessibilityLabel={c.label}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: c.accentBg }]}>
                <Ionicons name={c.icon} size={20} color={c.accent} />
              </View>
              {c.value !== undefined ? (
                <Text style={styles.cardValue}>{c.value}</Text>
              ) : (
                <Ionicons name="chevron-back" size={20} color={colors.textDisabled} />
              )}
            </View>
            <Text style={styles.cardLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  root: { padding: 16, gap: 16, paddingBottom: 96, width: '100%', maxWidth: 900, alignSelf: 'center' },

  hero: {
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  heroEyebrow: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, textAlign: textAlignStart() },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: textAlignStart() },
  badges: { flexDirection: rowDirectionStart, flexWrap: 'wrap', gap: 6 },
  badge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: textAlignStart(), marginTop: 4 },
  grid: { flexDirection: rowDirectionStart, flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...shadow.card,
  },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: rowDirectionStart, alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  cardLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: textAlignStart() },
}));
