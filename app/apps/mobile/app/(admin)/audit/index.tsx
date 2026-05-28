// app/apps/mobile/app/(admin)/audit/index.tsx
// FR-ADMIN-020 — admin audit log viewer with role-tiered visibility.
import { useMemo, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { type AdminPermission, type AdminRole, hasPermission } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminAuditSearch } from '../../../src/hooks/useAdminContentSearch';
import { AuditLogRow } from '../../../src/components/admin/content/AuditLogRow';
import he from '../../../src/i18n/locales/he';

const COMMON_ACTIONS = [
  null,
  'ban_user',
  'manual_remove_target',
  'auto_remove_target',
  'restore_target',
  'dismiss_report',
  'confirm_report',
  'admin_role_grant',
  'admin_role_revoke',
  'admin_task_create',
  'admin_task_update',
  'admin_task_delete',
  'delete_message',
  'delete_account',
] as const;

export default function AuditScreen() {
  const styles = useStyles();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [targetIdRaw, setTargetIdRaw] = useState('');
  const [action, setAction] = useState<string | null>(null);

  const filters = useMemo(() => ({
    targetUserId: targetIdRaw.trim() || undefined,
    action: action ?? undefined,
    limit: 100,
  }), [targetIdRaw, action]);

  const result = useAdminAuditSearch(filters);
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);

  if (rolesLoading) {
    return <View style={styles.center}><Text>{he.admin.content.loading}</Text></View>;
  }
  if (!can('audit.view_own')) {
    return <View style={styles.center}><Text style={styles.deniedTitle}>{he.admin.content.forbiddenTitle}</Text></View>;
  }

  const canSeeAll = can('audit.view_any');

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{he.admin.content.auditTitle}</Text>
      {!canSeeAll && <Text style={styles.tierHint}>{he.admin.content.tierLimited}</Text>}
      <TextInput
        style={styles.search}
        value={targetIdRaw}
        onChangeText={setTargetIdRaw}
        placeholder={he.admin.content.auditTargetPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {COMMON_ACTIONS.map((a) => (
          <Pressable
            key={a ?? '_all'}
            onPress={() => setAction(a)}
            style={[styles.chip, action === a && styles.chipActive]}
          >
            <Text style={[styles.chipText, action === a && styles.chipTextActive]}>
              {a === null
                ? he.admin.content.auditActionFilterAll
                : (he.admin.content.auditAction[a as keyof typeof he.admin.content.auditAction] ?? a)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.totalLabel}>{he.admin.content.totalCount(result.page.totalCount)}</Text>
      <FlatList
        data={[...result.page.rows]}
        keyExtractor={(e) => e.eventId}
        renderItem={({ item }) => <AuditLogRow row={item} />}
        refreshControl={<RefreshControl refreshing={result.isRefetching} onRefresh={result.refetch} />}
        ListEmptyComponent={
          !result.isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{he.admin.content.auditEmpty}</Text>
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
  title:       { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  tierHint:    { paddingHorizontal: 16, paddingBottom: 8, fontSize: 11, opacity: 0.65 },
  search: {
    marginHorizontal: 16, marginBottom: 8, padding: 10,
    borderRadius: 10, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    textAlign: 'right', fontSize: 14,
  },
  chips:          { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip:           { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.secondaryLight },
  chipActive:     { backgroundColor: colors.primary },
  chipText:       { fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse },
  totalLabel:     { paddingHorizontal: 16, paddingBottom: 4, fontSize: 11, opacity: 0.6 },
  empty:          { padding: 32, alignItems: 'center' },
  emptyText:      { fontSize: 14, opacity: 0.6 },
}));
