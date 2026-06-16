// app/apps/mobile/app/(admin)/crm/index.tsx
// V2-ADMIN-CRM-8 — V2 §13.9 Admin CRM (minimal contacts tracker).
// List + search + status filter + per-row edit / delete / "mark contacted".
import { useMemo, useState } from 'react';
import {
  Alert, FlatList, Platform, Pressable, RefreshControl, Text, View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CRM_CONTACT_STATUSES, hasPermission, isCrmContactError,
  type AdminPermission, type AdminRole,
  type CrmContact, type CrmContactStatus,
} from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { container } from '../../../src/lib/container';
import { AdminListControls } from '../../../src/components/admin/AdminListControls';
import { ContactCard } from '../../../src/components/admin/crm/ContactCard';
import { ContactFormModal } from '../../../src/components/admin/crm/ContactFormModal';
import he from '../../../src/i18n/locales/he';

type StatusFilter = CrmContactStatus | 'all';

async function confirmAction(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.confirm(message);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(he.admin.crm.confirm.deleteTitle, message, [
      { text: he.admin.crm.confirm.deleteCancel, style: 'cancel', onPress: () => resolve(false) },
      { text: he.admin.crm.confirm.deleteOk, onPress: () => resolve(true) },
    ]);
  });
}

export default function CrmScreen() {
  const styles = useStyles();
  const t = he.admin.crm;
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [creating, setCreating] = useState(false);

  const filters = useMemo(() => ({
    status: statusFilter === 'all' ? undefined : statusFilter,
    query:  query.trim() || undefined,
    limit:  100,
  }), [statusFilter, query]);

  const list = useQuery({
    queryKey: ['admin.crm.list', filters],
    queryFn:  () => container.listCrmContacts.execute(filters),
    enabled:  can('crm.manage'),
    staleTime: 15_000,
  });

  const remove = useMutation({
    mutationFn: (id: string) => container.deleteCrmContact.execute(id),
    onSuccess:  () => { void queryClient.invalidateQueries({ queryKey: ['admin.crm.list'] }); },
  });
  const markContacted = useMutation({
    mutationFn: (id: string) => container.markCrmContactContacted.execute(id),
    onSuccess:  () => { void queryClient.invalidateQueries({ queryKey: ['admin.crm.list'] }); },
  });

  if (rolesLoading) {
    return <View style={styles.center}><Text>{t.loading}</Text></View>;
  }
  if (!can('crm.manage')) {
    return <View style={styles.center}><Text style={styles.deniedTitle}>{t.forbiddenTitle}</Text></View>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={styles.newBtn}>
          <Text style={styles.newBtnText}>{t.newBtn}</Text>
        </Pressable>
      </View>

      <AdminListControls
        search={{
          value: query,
          onChangeText: setQuery,
          placeholder: t.searchPlaceholder,
        }}
        filterGroups={[{
          key: 'status',
          options: (['all', ...CRM_CONTACT_STATUSES] as readonly StatusFilter[]).map((s) => ({
            key: s,
            label: t.statusFilters[s],
            active: statusFilter === s,
            onPress: () => setStatusFilter(s),
          })),
        }]}
        totalLabel={t.totalCount(list.data?.totalCount ?? 0)}
      />

      <FlatList
        data={[...(list.data?.rows ?? [])]}
        keyExtractor={(c) => c.contactId}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onEdit={() => setEditing(item)}
            onMarkContacted={() => { void markContacted.mutateAsync(item.contactId); }}
            onDelete={async () => {
              const ok = await confirmAction(t.confirm.delete);
              if (!ok) return;
              try { await remove.mutateAsync(item.contactId); }
              catch (err) {
                const code = isCrmContactError(err) ? err.code : 'unknown';
                const msg = t.errors[code as keyof typeof t.errors] ?? t.errors.unknown;
                if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.alert(msg); }
                else Alert.alert(msg);
              }
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={list.isRefetching} onRefresh={() => { void list.refetch(); }} />
        }
        ListEmptyComponent={
          !list.isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
              <Text style={styles.emptyHint}>{t.emptyHint}</Text>
            </View>
          ) : null
        }
      />

      {(creating || editing) && (
        <ContactFormModal
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void queryClient.invalidateQueries({ queryKey: ['admin.crm.list'] });
          }}
        />
      )}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:        { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  deniedTitle: { fontSize: 18, fontWeight: '700' },
  header:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
                 flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:       { fontSize: 22, fontWeight: '700' },
  newBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  newBtnText:  { color: colors.textInverse, fontSize: 13, fontWeight: '700' },
  empty:          { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle:     { fontSize: 16, fontWeight: '600' },
  emptyHint:      { fontSize: 13, opacity: 0.6, textAlign: 'center' },
}));
