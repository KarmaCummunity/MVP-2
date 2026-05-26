// app/apps/mobile/src/components/admin/reports/CaseActions.tsx
// FR-ADMIN-013 — permission-gated action buttons on a report case detail.
// Buttons are wholly driven by PERMISSION_MATRIX in @kc/domain. Adding a new
// action in a future iteration is: matrix entry + action id + i18n label.
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  type AdminPermission,
  type AdminRole,
  type ReportCaseDetail,
  type AdminReportTargetType,
  hasPermission,
} from '@kc/domain';
import { container } from '../../../lib/container';
import { useAdminRoles } from '../../../hooks/useAdminRoles';
import { useAuthStore } from '../../../store/authStore';
import he from '../../../i18n/locales/he';

export interface CaseActionsProps {
  readonly detail: ReportCaseDetail;
  readonly onActed: () => void;
}

type ActionId =
  | 'confirm' | 'dismiss' | 'restore'
  | 'permanentBan' | 'manualRemove' | 'openSupport';

async function confirmDialog(question: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.confirm(question);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(he.admin.caseDetail.confirmDialog.title, question, [
      { text: he.admin.caseDetail.confirmDialog.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: he.admin.caseDetail.confirmDialog.ok, onPress: () => resolve(true) },
    ]);
  });
}

export function CaseActions({ detail, onActed }: CaseActionsProps) {
  const { roles } = useAdminRoles();
  const adminId = useAuthStore((s) => s.session?.userId ?? null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function run(action: ActionId): Promise<void> {
    const ok = await confirmDialog(he.admin.caseDetail.confirmDialog.message);
    if (!ok) return;
    setBusy(true);
    try {
      const openReports = detail.reporters.filter((r) => r.status === 'open');
      const oneReportId = openReports[0]?.reportId;
      switch (action) {
        case 'confirm':
          if (!oneReportId) return;
          await container.confirmReport.execute({ reportId: oneReportId });
          break;
        case 'dismiss':
          if (!oneReportId) return;
          await container.dismissReport.execute({ reportId: oneReportId });
          break;
        case 'restore':
          await container.restoreTarget.execute({
            targetType: detail.targetType as AdminReportTargetType,
            targetId: detail.targetId,
          });
          break;
        case 'permanentBan':
          if (detail.targetType !== 'user') return;
          if (!adminId) return;
          await container.banUser.execute({
            adminId,
            targetUserId: detail.targetId,
            reason: 'policy_violation',
            note: '',
          });
          break;
        case 'manualRemove':
          if (detail.targetType !== 'post') return;
          await container.adminRemovePost.execute({ postId: detail.targetId });
          break;
        case 'openSupport':
          // FR-ADMIN-013 — A4 will wire this to the actual support-thread flow
          // (find-or-create 1:1 with the latest reporter or target user). A1 ships
          // it as a no-op stub so the action shape stays stable.
          break;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin.reports.inbox'] });
      onActed();
    } finally {
      setBusy(false);
    }
  }

  function show(perm: AdminPermission): boolean {
    return hasPermission(roles as readonly AdminRole[], perm);
  }

  return (
    <View style={styles.row}>
      {show('reports.confirm_or_dismiss') && (
        <ActionButton
          label={he.admin.caseDetail.actionLabels.confirm}
          disabled={busy}
          onPress={() => { void run('confirm'); }}
        />
      )}
      {show('reports.confirm_or_dismiss') && (
        <ActionButton
          label={he.admin.caseDetail.actionLabels.dismiss}
          disabled={busy}
          onPress={() => { void run('dismiss'); }}
        />
      )}
      {show('reports.restore_target') && (
        <ActionButton
          label={he.admin.caseDetail.actionLabels.restore}
          disabled={busy}
          onPress={() => { void run('restore'); }}
        />
      )}
      {show('reports.manual_remove_post') && detail.targetType === 'post' && (
        <ActionButton
          label={he.admin.caseDetail.actionLabels.manualRemove}
          disabled={busy}
          onPress={() => { void run('manualRemove'); }}
        />
      )}
      {show('reports.permanent_ban') && detail.targetType === 'user' && (
        <ActionButton
          label={he.admin.caseDetail.actionLabels.permanentBan}
          disabled={busy}
          onPress={() => { void run('permanentBan'); }}
          variant="danger"
        />
      )}
    </View>
  );
}

interface ActionButtonProps {
  readonly label: string;
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly variant?: 'danger';
}

function ActionButton({ label, disabled, onPress, variant }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, variant === 'danger' && styles.btnDanger, disabled && styles.btnDisabled]}
      accessibilityRole="button"
    >
      <Text style={[styles.btnText, variant === 'danger' && styles.btnTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  btn:           { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eef2ff' },
  btnDanger:     { backgroundColor: '#fee2e2' },
  btnDisabled:   { opacity: 0.5 },
  btnText:       { fontSize: 13, fontWeight: '600' },
  btnTextDanger: { color: '#7f1d1d' },
});
