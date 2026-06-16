// app/apps/mobile/app/(admin)/tasks/index.tsx
// FR-ADMIN-018 — admin tasks list screen with chip filters.
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  FlatList, Pressable, RefreshControl, Text, View,
} from 'react-native';
import {
  ADMIN_TASK_CATEGORIES,
  ADMIN_TASK_STATUSES, type AdminPermission, type AdminRole,
  type AdminTaskCategory, type AdminTaskStatus,
  hasPermission,
} from '@kc/domain';
import type { AdminTaskListFilters } from '@kc/application';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminTasksList } from '../../../src/hooks/useAdminTasks';
import { AdminScreenHeader } from '../../../src/components/admin/AdminScreenHeader';
import { AdminListControls } from '../../../src/components/admin/AdminListControls';
import { TaskRow } from '../../../src/components/admin/tasks/TaskRow';
import {
  TaskAssigneeFilter,
  UNASSIGNED_TOKEN,
  type AssigneeFilterValue,
} from '../../../src/components/admin/tasks/TaskAssigneeFilter';
import {
  TaskDueRangeFilter,
  isValidIsoDate,
} from '../../../src/components/admin/tasks/TaskDueRangeFilter';
import he from '../../../src/i18n/locales/he';

function parseDueFrom(value: string): Date | undefined {
  if (!isValidIsoDate(value) || value.length === 0) return undefined;
  return new Date(`${value}T00:00:00.000Z`);
}

function parseDueTo(value: string): Date | undefined {
  if (!isValidIsoDate(value) || value.length === 0) return undefined;
  // End-of-day so a "to" of 2026-06-01 includes anything dated that day.
  return new Date(`${value}T23:59:59.999Z`);
}

export default function TasksScreen() {
  const styles = useStyles();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [statusFilter, setStatusFilter] = useState<AdminTaskStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<AdminTaskCategory | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterValue>(null);
  const [dueFromText, setDueFromText] = useState('');
  const [dueToText, setDueToText] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filters = useMemo<AdminTaskListFilters>(() => {
    const baseAssignee = assigneeFilter && assigneeFilter !== UNASSIGNED_TOKEN
      ? assigneeFilter
      : undefined;
    return {
      status:         statusFilter   ?? undefined,
      category:       categoryFilter ?? undefined,
      assigneeId:     baseAssignee,
      unassignedOnly: assigneeFilter === UNASSIGNED_TOKEN ? true : undefined,
      dueFrom:        parseDueFrom(dueFromText),
      dueTo:          parseDueTo(dueToText),
      onlyMine,
      overdue:        overdueOnly,
    };
  }, [statusFilter, categoryFilter, assigneeFilter, dueFromText, dueToText, onlyMine, overdueOnly]);

  const q = useAdminTasksList(filters);
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);

  if (rolesLoading) {
    return <View style={styles.center}><Text>{he.admin.tasks.loading}</Text></View>;
  }
  if (!can('tasks.view')) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>{he.admin.tasks.forbiddenTitle}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AdminScreenHeader
        title={he.admin.tasks.title}
        right={can('tasks.create') ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(admin)/tasks/new' as never)}
            style={styles.newBtn}
          >
            <Text style={styles.newBtnText}>{he.admin.tasks.newBtn}</Text>
          </Pressable>
        ) : undefined}
      />

      <AdminListControls
        filterGroups={[
          {
            key: 'status',
            options: [
              {
                key: '_all',
                label: he.admin.tasks.filters.all,
                active: statusFilter === null && !overdueOnly,
                onPress: () => { setStatusFilter(null); setOverdueOnly(false); },
              },
              ...ADMIN_TASK_STATUSES.map((s) => ({
                key: s,
                label: he.admin.tasks.status[s],
                active: statusFilter === s,
                onPress: () => { setStatusFilter(statusFilter === s ? null : s); },
              })),
              {
                key: '_overdue',
                label: he.admin.tasks.filters.overdue,
                active: overdueOnly,
                onPress: () => setOverdueOnly((v) => !v),
              },
              {
                key: '_mine',
                label: he.admin.tasks.filters.onlyMine,
                active: onlyMine,
                onPress: () => setOnlyMine((v) => !v),
              },
            ],
          },
          {
            key: 'category',
            options: [
              {
                key: '_all',
                label: he.admin.tasks.categoryFilters.all,
                active: categoryFilter === null,
                onPress: () => setCategoryFilter(null),
              },
              ...ADMIN_TASK_CATEGORIES.map((c) => ({
                key: c,
                label: he.admin.tasks.category[c],
                active: categoryFilter === c,
                onPress: () => setCategoryFilter(categoryFilter === c ? null : c),
              })),
            ],
          },
        ]}
        afterFilters={(
          <>
            {can('admins.view') && (
              <TaskAssigneeFilter value={assigneeFilter} onChange={setAssigneeFilter} />
            )}
            <TaskDueRangeFilter
              fromValue={dueFromText}
              toValue={dueToText}
              onChange={({ from, to }) => { setDueFromText(from); setDueToText(to); }}
              onClear={() => { setDueFromText(''); setDueToText(''); }}
            />
          </>
        )}
      />


      <FlatList
        data={[...q.tasks]}
        keyExtractor={(t) => t.taskId}
        renderItem={({ item }) => <TaskRow task={item} />}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} />
        }
        ListEmptyComponent={
          !q.isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{he.admin.tasks.emptyTitle}</Text>
              <Text style={styles.emptyHint}>{he.admin.tasks.emptyHint}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:            { flex: 1, backgroundColor: colors.background },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  deniedTitle:     { fontSize: 18, fontWeight: '700' },
  newBtn:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  newBtnText:      { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  empty:           { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle:      { fontSize: 16, fontWeight: '600' },
  emptyHint:       { fontSize: 13, opacity: 0.6, textAlign: 'center' },
}));
