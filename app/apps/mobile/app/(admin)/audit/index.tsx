// app/apps/mobile/app/(admin)/audit/index.tsx
// FR-ADMIN-020 — admin audit log viewer with role-tiered visibility.
// V2-ADMIN-AUDIT-5 — date-range filter + CSV export (web).
import { useMemo, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { type AdminPermission, type AdminRole, hasPermission } from '@kc/domain';
import type { AdminAuditSearchFilters } from '@kc/application';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminAuditSearch } from '../../../src/hooks/useAdminContentSearch';
import { AdminScreenHeader } from '../../../src/components/admin/AdminScreenHeader';
import { AdminListControls } from '../../../src/components/admin/AdminListControls';
import { AuditLogRow } from '../../../src/components/admin/content/AuditLogRow';
import { rowDirectionStart } from '../../../src/lib/rtlLayout';
import { container } from '../../../src/lib/container';
import {
  downloadAuditCsv, isCsvExportSupported,
} from '../../../src/lib/auditCsvExport';
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function parseFromDate(value: string): Date | undefined {
  if (!ISO_DATE.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function parseToDate(value: string): Date | undefined {
  if (!ISO_DATE.test(value)) return undefined;
  const d = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default function AuditScreen() {
  const styles = useStyles();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const [targetIdRaw, setTargetIdRaw] = useState('');
  const [action, setAction] = useState<string | null>(null);
  const [fromRaw, setFromRaw] = useState('');
  const [toRaw, setToRaw] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const filters = useMemo<AdminAuditSearchFilters>(() => ({
    targetUserId: targetIdRaw.trim() || undefined,
    action: action ?? undefined,
    fromDate: parseFromDate(fromRaw),
    toDate:   parseToDate(toRaw),
    limit: 100,
  }), [targetIdRaw, action, fromRaw, toRaw]);

  const result = useAdminAuditSearch(filters);
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);

  async function doExport() {
    setExportError(null);
    if (!isCsvExportSupported()) {
      setExportError(he.admin.content.csvExport.unsupported);
      return;
    }
    setExporting(true);
    try {
      const page = await container.adminSearchAudit.execute({
        ...filters,
        limit: 500,
        offset: 0,
      });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const name  = `audit-${stamp}.csv`;
      const ok = downloadAuditCsv(page.rows, name);
      if (!ok) setExportError(he.admin.content.csvExport.failed);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : he.admin.content.csvExport.failed);
    } finally {
      setExporting(false);
    }
  }

  if (rolesLoading) {
    return <View style={styles.center}><Text>{he.admin.content.loading}</Text></View>;
  }
  if (!can('audit.view_own')) {
    return <View style={styles.center}><Text style={styles.deniedTitle}>{he.admin.content.forbiddenTitle}</Text></View>;
  }

  const canSeeAll = can('audit.view_any');

  return (
    <View style={styles.root}>
      <AdminScreenHeader
        title={he.admin.content.auditTitle}
        subtitle={!canSeeAll ? he.admin.content.tierLimited : undefined}
        right={(
          <Pressable
            accessibilityRole="button"
            onPress={() => { void doExport(); }}
            disabled={exporting}
            style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          >
            <Text style={styles.exportBtnText}>
              {exporting ? he.admin.content.csvExport.busy : he.admin.content.csvExport.action}
            </Text>
          </Pressable>
        )}
      />
      <AdminListControls
        search={{
          value: targetIdRaw,
          onChangeText: setTargetIdRaw,
          placeholder: he.admin.content.auditTargetPlaceholder,
        }}
        afterSearch={(
          <>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>{he.admin.content.dateFromLabel}</Text>
                <TextInput
                  style={styles.dateInput}
                  value={fromRaw}
                  onChangeText={setFromRaw}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>{he.admin.content.dateToLabel}</Text>
                <TextInput
                  style={styles.dateInput}
                  value={toRaw}
                  onChangeText={setToRaw}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            {exportError !== null && (
              <Text style={styles.exportError}>{exportError}</Text>
            )}
          </>
        )}
        filterGroups={[{
          key: 'action',
          options: COMMON_ACTIONS.map((a) => ({
            key: a ?? '_all',
            label: a === null
              ? he.admin.content.auditActionFilterAll
              : (he.admin.content.auditAction[a as keyof typeof he.admin.content.auditAction] ?? a),
            active: action === a,
            onPress: () => setAction(a),
          })),
        }]}
        totalLabel={he.admin.content.totalCount(result.page.totalCount)}
      />
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
  empty:          { padding: 32, alignItems: 'center' },
  emptyText:      { fontSize: 14, opacity: 0.6 },
  dateRow:        { flexDirection: rowDirectionStart, gap: 8, paddingHorizontal: 16, paddingBottom: 8, alignItems: 'flex-end' },
  dateField:      { flex: 1, gap: 4 },
  dateLabel:      { fontSize: 11, opacity: 0.7 },
  dateInput: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 8,
    padding: 8, fontSize: 13, textAlign: 'left', backgroundColor: colors.surface,
  },
  exportBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: colors.primary,
  },
  exportBtnDisabled: { opacity: 0.5 },
  exportBtnText:  { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
  exportError:    { paddingHorizontal: 16, paddingBottom: 4, color: colors.error, fontSize: 11 },
}));
