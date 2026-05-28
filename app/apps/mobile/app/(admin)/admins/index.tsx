// app/apps/mobile/app/(admin)/admins/index.tsx
// FR-ADMIN-015 / FR-ADMIN-016 — Admin RBAC management screen.
//
// Visibility per PERMISSION_MATRIX['admins.view']:
//   - super_admin: full list + grant + revoke + revoked-toggle.
//   - moderator:   read-only list (no grant, no revoke).
//   - support:     no access (renders a denial card; AdminGate may also block earlier).
import { useMemo, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View,
} from 'react-native';
import {
  type AdminGrant, type AdminPermission, type AdminRole,
  hasPermission, isAdminRoleError,
} from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminsList } from '../../../src/hooks/useAdminsList';
import { useRevokeAdminRole } from '../../../src/hooks/useAdminRoleMutations';
import { AdminRow } from '../../../src/components/admin/admins/AdminRow';
import { GrantRoleModal } from '../../../src/components/admin/admins/GrantRoleModal';
import he from '../../../src/i18n/locales/he';

type Section =
  | { kind: 'header'; role: AdminRole; count: number }
  | { kind: 'row';    grant: AdminGrant };

function buildSections(grants: readonly AdminGrant[]): Section[] {
  const out: Section[] = [];
  const order: AdminRole[] = ['super_admin', 'moderator', 'support'];
  for (const role of order) {
    const rows = grants.filter((g) => g.role === role);
    if (rows.length === 0) continue;
    out.push({ kind: 'header', role, count: rows.length });
    for (const g of rows) out.push({ kind: 'row', grant: g });
  }
  return out;
}

export default function AdminsScreen() {
  const styles = useStyles();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeErr, setRevokeErr] = useState<string | null>(null);

  const list = useAdminsList(includeRevoked);
  const revoke = useRevokeAdminRole();

  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);
  const sections = useMemo(() => buildSections(list.grants), [list.grants]);

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

  async function onRevoke(grantId: string) {
    setRevokeErr(null);
    try {
      await revoke.mutateAsync(grantId);
    } catch (e) {
      const code = isAdminRoleError(e) ? e.code : 'unknown';
      setRevokeErr(code);
    }
  }

  const canGrant = can('admins.grant_role');
  const canRevoke = can('admins.revoke_role');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{he.admin.admins.title}</Text>
        <View style={styles.headerControls}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{he.admin.admins.includeRevokedLabel}</Text>
            <Switch value={includeRevoked} onValueChange={setIncludeRevoked} />
          </View>
          {canGrant && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setGrantOpen(true)}
              style={styles.grantBtn}
            >
              <Text style={styles.grantBtnText}>{he.admin.admins.grantBtn}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {revokeErr !== null && (
        <Text style={styles.errorBanner}>
          {he.admin.admins.revokeErrors[revokeErr as keyof typeof he.admin.admins.revokeErrors]
            ?? he.admin.admins.revokeErrors.unknown}
        </Text>
      )}

      <FlatList
        data={sections}
        keyExtractor={(s, i) => (s.kind === 'header' ? `h:${s.role}` : `r:${s.grant.grantId}:${i}`)}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{he.admin.roles[item.role]}</Text>
              <Text style={styles.sectionHeaderCount}>{item.count}</Text>
            </View>
          ) : (
            <AdminRow
              grant={item.grant}
              canRevoke={canRevoke}
              busy={revoke.isPending}
              onRevoke={(id) => { void onRevoke(id); }}
            />
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
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} />
        }
      />

      {canGrant && (
        <GrantRoleModal visible={grantOpen} onClose={() => setGrantOpen(false)} />
      )}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:            { flex: 1, backgroundColor: colors.background },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  deniedTitle:     { fontSize: 18, fontWeight: '700' },
  deniedHint:      { fontSize: 13, opacity: 0.6, textAlign: 'center' },
  header:          { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  title:           { fontSize: 22, fontWeight: '700' },
  headerControls:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel:     { fontSize: 13, opacity: 0.75 },
  grantBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: colors.primary,
  },
  grantBtnText:    { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
    backgroundColor: colors.background,
  },
  sectionHeaderText:  { fontSize: 14, fontWeight: '700', opacity: 0.8 },
  sectionHeaderCount: { fontSize: 12, opacity: 0.5 },
  errorBanner: {
    backgroundColor: colors.errorLight, padding: 10, marginHorizontal: 16, borderRadius: 8,
    fontSize: 12, color: '#7f1d1d',
  },
  empty:      { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyHint:  { fontSize: 13, opacity: 0.6, textAlign: 'center' },
}));
