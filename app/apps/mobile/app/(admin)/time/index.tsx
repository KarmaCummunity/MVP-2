// app/apps/mobile/app/(admin)/time/index.tsx
// V2-ADMIN-TIME-10 — V2 §13.10 Admin Time (timesheets).
import { useMemo, useState } from 'react';
import {
  Alert, FlatList, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission, isTimesheetError,
  type AdminPermission, type AdminRole, type TimesheetEntry, type TimesheetStatus,
} from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAuthStore } from '../../../src/store/authStore';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { container } from '../../../src/lib/container';
import { TimesheetEntryCard } from '../../../src/components/admin/time/TimesheetEntryCard';
import { TimesheetFormModal } from '../../../src/components/admin/time/TimesheetFormModal';
import he from '../../../src/i18n/locales/he';

type Tab = 'mine' | 'pending' | 'all';

async function confirmAction(message: string): Promise<boolean> {
  if (Platform.OS === 'web') return typeof window !== 'undefined' && window.confirm(message);
  return new Promise<boolean>((resolve) => {
    Alert.alert(he.admin.time.confirm.deleteTitle, message, [
      { text: he.admin.time.confirm.deleteCancel, style: 'cancel', onPress: () => resolve(false) },
      { text: he.admin.time.confirm.deleteOk, onPress: () => resolve(true) },
    ]);
  });
}

export default function TimeScreen() {
  const styles = useStyles();
  const t = he.admin.time;
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.session?.userId ?? null);

  const canApprove = can('time.approve');
  const [tab, setTab] = useState<Tab>('mine');
  const [editing, setEditing] = useState<TimesheetEntry | null>(null);
  const [creating, setCreating] = useState(false);

  const filters = useMemo(() => {
    const f: { status?: TimesheetStatus; userId?: string; limit: number } = { limit: 100 };
    if (tab === 'mine')    f.userId = myId ?? undefined;
    if (tab === 'pending') f.status = 'submitted';
    return f;
  }, [tab, myId]);

  const list = useQuery({
    queryKey: ['admin.time.list', filters],
    queryFn:  () => container.listTimesheets.execute(filters),
    enabled:  can('time.report'),
    staleTime: 15_000,
  });

  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ['admin.time.list'] }); };
  const submit  = useMutation({ mutationFn: (id: string) => container.submitTimesheet.execute(id),  onSuccess: invalidate });
  const remove  = useMutation({ mutationFn: (id: string) => container.deleteTimesheet.execute(id),  onSuccess: invalidate });
  const approve = useMutation({ mutationFn: (id: string) => container.approveTimesheet.execute({ entryId: id }), onSuccess: invalidate });
  const reject  = useMutation({ mutationFn: (id: string) => container.rejectTimesheet.execute({ entryId: id }),  onSuccess: invalidate });

  if (rolesLoading) {
    return <View style={styles.center}><Text>{t.loading}</Text></View>;
  }
  if (!can('time.report')) {
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {(['mine', 'pending', 'all'] as readonly Tab[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setTab(value)}
            style={[styles.chip, tab === value && styles.chipActive]}
          >
            <Text style={[styles.chipText, tab === value && styles.chipTextActive]}>
              {value === 'mine' ? t.myEntriesTab : value === 'pending' ? t.pendingTab : t.allTab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.totalLabel}>{t.totalCount(list.data?.totalCount ?? 0)}</Text>

      <FlatList
        data={[...(list.data?.rows ?? [])]}
        keyExtractor={(e) => e.entryId}
        renderItem={({ item }) => {
          const isMine = item.userId === myId;
          return (
            <TimesheetEntryCard
              entry={item}
              isMine={isMine}
              canApprove={canApprove}
              onEdit={() => setEditing(item)}
              onSubmit={() => { void submit.mutateAsync(item.entryId).catch(() => {/* swallowed */}); }}
              onDelete={async () => {
                const ok = await confirmAction(t.confirm.delete);
                if (!ok) return;
                try { await remove.mutateAsync(item.entryId); }
                catch (err) {
                  const code = isTimesheetError(err) ? err.code : 'unknown';
                  const msg = t.errors[code as keyof typeof t.errors] ?? t.errors.unknown;
                  if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.alert(msg); }
                  else Alert.alert(msg);
                }
              }}
              onApprove={() => { void approve.mutateAsync(item.entryId); }}
              onReject={() => { void reject.mutateAsync(item.entryId); }}
            />
          );
        }}
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
        <TimesheetFormModal
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            invalidate();
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
  chips:       { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: colors.secondaryLight,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: colors.textInverse },
  totalLabel:     { paddingHorizontal: 16, paddingBottom: 8, fontSize: 11, opacity: 0.6 },
  empty:          { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle:     { fontSize: 16, fontWeight: '600' },
  emptyHint:      { fontSize: 13, opacity: 0.6, textAlign: 'center' },
}));
