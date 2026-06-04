// app/apps/mobile/app/(admin)/tasks/index.tsx
// FR-ADMIN-018 — admin tasks list screen with chip filters.
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import {
  ADMIN_TASK_STATUSES, type AdminPermission, type AdminRole, type AdminTaskStatus,
  hasPermission,
} from '@kc/domain';
import type { AdminTaskListFilters } from '@kc/application';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminTasksList } from '../../../src/hooks/useAdminTasks';
import { AdminScreenHeader } from '../../../src/components/admin/AdminScreenHeader';
import { TaskRow } from '../../../src/components/admin/tasks/TaskRow';
import he from '../../../src/i18n/locales/he';

export default function TasksScreen() {
  const styles = useStyles();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [statusFilter, setStatusFilter] = useState<AdminTaskStatus | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filters = useMemo<AdminTaskListFilters>(() => ({
    status:    statusFilter ?? undefined,
    onlyMine,
    overdue:   overdueOnly,
  }), [statusFilter, onlyMine, overdueOnly]);

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <FilterChip
          label={he.admin.tasks.filters.all}
          active={statusFilter === null && !overdueOnly}
          onPress={() => { setStatusFilter(null); setOverdueOnly(false); }}
        />
        {ADMIN_TASK_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={he.admin.tasks.status[s]}
            active={statusFilter === s}
            onPress={() => { setStatusFilter(statusFilter === s ? null : s); }}
          />
        ))}
        <FilterChip
          label={he.admin.tasks.filters.overdue}
          active={overdueOnly}
          onPress={() => setOverdueOnly((v) => !v)}
        />
        <FilterChip
          label={he.admin.tasks.filters.onlyMine}
          active={onlyMine}
          onPress={() => setOnlyMine((v) => !v)}
        />
      </ScrollView>

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

interface FilterChipProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:            { flex: 1, backgroundColor: colors.background },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  deniedTitle:     { fontSize: 18, fontWeight: '700' },
  newBtn:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  newBtnText:      { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  chips:           { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: colors.secondaryLight,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:        { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  chipTextActive:  { color: colors.textInverse },
  empty:           { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle:      { fontSize: 16, fontWeight: '600' },
  emptyHint:       { fontSize: 13, opacity: 0.6, textAlign: 'center' },
}));
