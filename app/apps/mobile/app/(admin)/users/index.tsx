// app/apps/mobile/app/(admin)/users/index.tsx
// FR-ADMIN-019 — admin users search screen.
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { type AdminPermission, type AdminRole, hasPermission } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminUserSearch } from '../../../src/hooks/useAdminContentSearch';
import { AdminScreenHeader } from '../../../src/components/admin/AdminScreenHeader';
import { AdminListControls } from '../../../src/components/admin/AdminListControls';
import { UserSearchRow } from '../../../src/components/admin/content/UserSearchRow';
import he from '../../../src/i18n/locales/he';

const STATUS_OPTIONS = [
  { value: null,                            key: 'all' as const },
  { value: 'active',                        key: 'active' as const },
  { value: 'pending_verification',          key: 'pending' as const },
  { value: 'banned',                        key: 'banned' as const },
  { value: 'suspended_admin',               key: 'suspendedAdmin' as const },
  { value: 'suspended_for_false_reports',   key: 'suspendedFalse' as const },
  { value: 'deleted',                       key: 'deleted' as const },
];

export default function UsersScreen() {
  const styles = useStyles();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filters = useMemo(() => ({
    query: query.trim() || undefined,
    status: statusFilter ?? undefined,
  }), [query, statusFilter]);

  const result = useAdminUserSearch(filters);
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);

  if (rolesLoading) {
    return <View style={styles.center}><Text>{he.admin.content.loading}</Text></View>;
  }
  if (!can('users.search')) {
    return <View style={styles.center}><Text style={styles.deniedTitle}>{he.admin.content.forbiddenTitle}</Text></View>;
  }

  return (
    <View style={styles.root}>
      <AdminScreenHeader title={he.admin.content.usersTitle} />
      <AdminListControls
        search={{
          value: query,
          onChangeText: setQuery,
          placeholder: he.admin.content.searchUsersPlaceholder,
        }}
        filterGroups={[{
          key: 'status',
          options: STATUS_OPTIONS.map((s) => ({
            key: s.key,
            label: he.admin.content.userStatusFilter[s.key],
            active: statusFilter === s.value,
            onPress: () => setStatusFilter(s.value),
          })),
        }]}
        totalLabel={he.admin.content.totalCount(result.page.totalCount)}
      />
      <FlatList
        data={[...result.page.rows]}
        keyExtractor={(u) => u.userId}
        renderItem={({ item }) => <UserSearchRow row={item} />}
        refreshControl={<RefreshControl refreshing={result.isRefetching} onRefresh={result.refetch} />}
        ListEmptyComponent={
          !result.isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{he.admin.content.usersEmpty}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:        { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  deniedTitle: { fontSize: 18, fontWeight: '700' },
  empty:       { padding: 32, alignItems: 'center' },
  emptyText:   { fontSize: 14, opacity: 0.6 },
}));
