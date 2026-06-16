// app/apps/mobile/app/(admin)/admins/index.tsx
// FR-ADMIN-015 / FR-ADMIN-016 / FR-ADMIN-022 — Admin RBAC management screen.
//
// One card per user (all roles as badges) — tapping opens the admin-detail
// screen where per-role grants + revoke live. Section counts reflect ACTIVE
// team members; fully-revoked users surface in a separate "revoked" section
// only when the include-revoked toggle is on (so a single active super_admin
// no longer reads as "8" once historical revoked grants are included).
//
// Visibility per PERMISSION_MATRIX['admins.view']:
//   - super_admin: full list + grant + revoke (revoke on detail screen).
//   - moderator:   read-only list.
//   - support:     no access (denial card; AdminGate may also block earlier).
import { useMemo, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, ScrollView, Switch, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  type AdminPermission, type AdminPerson, type AdminRole,
  groupGrantsByUser, hasPermission,
} from '@kc/domain';
import { makeUseStyles, useBreakpoint } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminsList } from '../../../src/hooks/useAdminsList';
import { useOrgTree } from '../../../src/hooks/useOrgTree';
import { rowDirectionStart, textAlignStart } from '../../../src/lib/rtlLayout';
import { AdminScreenHeader } from '../../../src/components/admin/AdminScreenHeader';
import { AdminPersonCard } from '../../../src/components/admin/admins/AdminPersonCard';
import { GrantRoleModal } from '../../../src/components/admin/admins/GrantRoleModal';
import { OrgTree } from '../../../src/components/admin/admins/OrgTree';
import { OrgSwitcher, type OrgOption } from '../../../src/components/admin/admins/OrgSwitcher';
import he from '../../../src/i18n/locales/he';

type ViewMode = 'list' | 'tree';

function distinctOrgs(members: readonly { orgId: string | null; orgName: string | null }[]): OrgOption[] {
  const seen = new Map<string, string>();
  for (const m of members) {
    if (m.orgId !== null && !seen.has(m.orgId)) seen.set(m.orgId, m.orgName ?? m.orgId);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

type Item =
  | { kind: 'header'; title: string; count: number }
  | { kind: 'person'; person: AdminPerson };

function buildItems(people: readonly AdminPerson[], includeRevoked: boolean): Item[] {
  const active = people.filter((p) => p.hasActiveGrant);
  const revoked = people.filter((p) => !p.hasActiveGrant);
  const out: Item[] = [];
  if (active.length > 0) {
    out.push({ kind: 'header', title: he.admin.admins.activeSectionTitle, count: active.length });
    for (const p of active) out.push({ kind: 'person', person: p });
  }
  if (includeRevoked && revoked.length > 0) {
    out.push({ kind: 'header', title: he.admin.admins.revokedSectionTitle, count: revoked.length });
    for (const p of revoked) out.push({ kind: 'person', person: p });
  }
  return out;
}

export default function AdminsScreen() {
  const styles = useStyles();
  const router = useRouter();
  const isWide = useBreakpoint() !== 'mobile';
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [orgId, setOrgId] = useState<string | null>(null);

  const list = useAdminsList(includeRevoked);
  const tree = useOrgTree(orgId, viewMode === 'tree');
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);
  const people = useMemo(() => groupGrantsByUser(list.grants), [list.grants]);
  const items = useMemo(() => buildItems(people, includeRevoked), [people, includeRevoked]);
  const orgs = useMemo(() => distinctOrgs(tree.members), [tree.members]);
  const isSuper = roles.includes('super_admin');

  if (rolesLoading) {
    return <View style={styles.center}><Text>{he.admin.admins.loading}</Text></View>;
  }
  if (!can('admins.view')) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>{he.admin.admins.forbiddenTitle}</Text>
        <Text style={styles.deniedHint}>{he.admin.admins.forbiddenHint}</Text>
      </View>
    );
  }

  const canGrant = can('admins.grant_role');
  const openDetail = (userId: string) =>
    router.push({ pathname: '/(admin)/admins/[userId]' as never, params: { userId } } as never);

  return (
    <View style={styles.root}>
      <AdminScreenHeader title={he.admin.admins.title} />
      <View style={styles.headerControls}>
        <View style={styles.segment}>
          {(['list', 'tree'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              onPress={() => setViewMode(m)}
              style={[styles.segmentBtn, viewMode === m && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, viewMode === m && styles.segmentTextActive]}>
                {m === 'list' ? he.admin.admins.viewList : he.admin.admins.viewTree}
              </Text>
            </Pressable>
          ))}
        </View>
        {canGrant && (
          <Pressable accessibilityRole="button" onPress={() => setGrantOpen(true)} style={styles.grantBtn}>
            <Text style={styles.grantBtnText}>{he.admin.admins.grantBtn}</Text>
          </Pressable>
        )}
      </View>

      {viewMode === 'list' && (
        <View style={styles.toggleRow}>
          <Switch value={includeRevoked} onValueChange={setIncludeRevoked} />
          <Text style={styles.toggleLabel}>{he.admin.admins.includeRevokedLabel}</Text>
        </View>
      )}

      {viewMode === 'list' ? (
        <FlatList
          data={items}
          keyExtractor={(it, i) => (it.kind === 'header' ? `h:${it.title}` : `p:${it.person.userId}:${i}`)}
          contentContainerStyle={[styles.listContent, isWide && styles.listContentWide]}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{item.title}</Text>
                <Text style={styles.sectionHeaderCount}>{item.count}</Text>
              </View>
            ) : (
              <AdminPersonCard person={item.person} onPress={openDetail} />
            )
          }
          ListEmptyComponent={
            !list.isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>{he.admin.admins.emptyTitle}</Text>
                <Text style={styles.emptyHint}>{he.admin.admins.emptyHint}</Text>
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} />}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, isWide && styles.listContentWide]}
          refreshControl={<RefreshControl refreshing={tree.isRefetching} onRefresh={tree.refetch} />}
        >
          {isSuper && orgs.length > 1 && (
            <OrgSwitcher orgs={orgs} selected={orgId} onSelect={setOrgId} />
          )}
          <OrgTree forest={tree.forest} onSelect={openDetail} />
        </ScrollView>
      )}

      {canGrant && <GrantRoleModal visible={grantOpen} onClose={() => setGrantOpen(false)} />}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:        { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  deniedHint:  { fontSize: 13, opacity: 0.6, textAlign: 'center', color: colors.textSecondary },
  headerControls: {
    flexDirection: rowDirectionStart, alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  toggleRow:   { flexDirection: rowDirectionStart, alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  toggleLabel: { fontSize: 13, color: colors.textSecondary },
  segment:     { flexDirection: rowDirectionStart, backgroundColor: colors.surface, borderRadius: 999, padding: 3 },
  segmentBtn:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  segmentTextActive: { color: colors.textInverse },
  grantBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  grantBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  listContent:     { paddingBottom: 24 },
  listContentWide: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  sectionHeader: {
    flexDirection: rowDirectionStart, justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  sectionHeaderText:  { fontSize: 14, fontWeight: '800', color: colors.textPrimary, textAlign: textAlignStart() },
  sectionHeaderCount: { fontSize: 12, color: colors.textSecondary },
  empty:      { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  emptyHint:  { fontSize: 13, opacity: 0.6, textAlign: 'center', color: colors.textSecondary },
}));
