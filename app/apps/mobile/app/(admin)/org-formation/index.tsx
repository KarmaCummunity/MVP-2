// app/apps/mobile/app/(admin)/org-formation/index.tsx
// FR-ADMIN-021 — "Journey to a Nonprofit": guided formation checklist + governance.
import { useMemo, useState } from 'react';
import {
  Alert, FlatList, Platform, RefreshControl, Text, View,
} from 'react-native';
import {
  formationProgressPercent, hasPermission, isOrgFormationError, validateGovernance,
  type AdminPermission, type AdminRole, type FormationStep, type FormationStepStatus,
  type GovernanceAssignment, type GovernanceRole,
} from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useOrgFormation } from '../../../src/hooks/useOrgFormation';
import { StepCard } from '../../../src/components/admin/org-formation/StepCard';
import { GovernanceSection } from '../../../src/components/admin/org-formation/GovernanceSection';
import { ValidationBanner } from '../../../src/components/admin/org-formation/ValidationBanner';
import { AssignMemberModal } from '../../../src/components/admin/org-formation/AssignMemberModal';
import { StepContentEditModal } from '../../../src/components/admin/org-formation/StepContentEditModal';
import he from '../../../src/i18n/locales/he';

function alertMessage(msg: string): void {
  if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.alert(msg); }
  else Alert.alert(msg);
}

function confirmAction(message: string, okLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(message));
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert('', message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function OrgFormationScreen() {
  const styles = useStyles();
  const t = he.admin.orgFormation;
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);
  const f = useOrgFormation('IL');

  const [assignRole, setAssignRole] = useState<GovernanceRole | null>(null);
  const [editing, setEditing] = useState<FormationStep | null>(null);

  const steps = useMemo(() => [...(f.steps.data ?? [])], [f.steps.data]);
  const governance = useMemo(() => [...(f.governance.data ?? [])], [f.governance.data]);
  const validation = useMemo(() => validateGovernance(governance), [governance]);
  const errors = t.errors;

  if (rolesLoading) {
    return <View style={styles.center}><Text>{t.loading}</Text></View>;
  }
  if (!can('org_formation.view')) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>{t.forbiddenTitle}</Text>
        <Text style={styles.deniedHint}>{t.forbiddenHint}</Text>
      </View>
    );
  }

  const canManage = can('org_formation.manage');
  const canEdit = can('org_formation.edit_content');
  const doneCount = steps.filter((s) => s.progressStatus === 'done').length;
  const pct = formationProgressPercent(steps);

  async function cycleStatus(step: FormationStep, next: FormationStepStatus): Promise<void> {
    try {
      await f.setStepProgress.mutateAsync({ stepKey: step.stepKey, status: next });
    } catch (e) {
      const code = isOrgFormationError(e) ? e.code : 'unknown';
      alertMessage(errors[code as keyof typeof errors] ?? errors.unknown);
    }
  }

  async function removeMember(a: GovernanceAssignment): Promise<void> {
    const g = t.governance;
    const ok = await confirmAction(
      g.removeConfirm(a.displayName ?? g.unnamed), g.removeOk, g.removeCancel,
    );
    if (!ok) return;
    try { await f.removeMember.mutateAsync(a.assignmentId); }
    catch (e) {
      const code = isOrgFormationError(e) ? e.code : 'unknown';
      alertMessage(errors[code as keyof typeof errors] ?? errors.unknown);
    }
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={steps}
        keyExtractor={(s) => s.stepId}
        renderItem={({ item, index }) => (
          <StepCard
            step={item}
            index={index}
            canManage={canManage}
            canEdit={canEdit}
            onCycleStatus={(next) => { void cycleStatus(item, next); }}
            onEdit={() => setEditing(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={f.steps.isRefetching}
            onRefresh={() => { void f.steps.refetch(); void f.governance.refetch(); }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.country}>{t.countries.IL}</Text>
            </View>
            <Text style={styles.disclaimer}>{t.disclaimer}</Text>
            <View style={styles.progressBox}>
              <Text style={styles.progressText}>{t.progressLabel(doneCount, steps.length, pct)}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
            </View>
            <ValidationBanner validation={validation} />
            <GovernanceSection
              assignments={governance}
              canManage={canManage}
              onAdd={(role) => setAssignRole(role)}
              onRemove={removeMember}
            />
          </View>
        }
        ListEmptyComponent={
          !f.steps.isLoading ? <Text style={styles.empty}>{t.loading}</Text> : null
        }
        contentContainerStyle={styles.listContent}
      />

      {assignRole !== null && (
        <AssignMemberModal
          governanceRole={assignRole}
          onClose={() => setAssignRole(null)}
          onAssign={(userId) =>
            f.assignMember.mutateAsync({ userId, governanceRole: assignRole })
              .then(() => undefined)}
        />
      )}

      {editing !== null && (
        <StepContentEditModal
          step={editing}
          onClose={() => setEditing(null)}
          onSave={(bodyText, tips) =>
            f.updateStepContent.mutateAsync({ stepId: editing.stepId, bodyText, tips })
              .then(() => undefined)}
        />
      )}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  deniedTitle: { fontSize: 18, fontWeight: '700' },
  deniedHint: { fontSize: 13, opacity: 0.6, textAlign: 'center' },
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  country: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  disclaimer: {
    marginHorizontal: 16, marginBottom: 12, fontSize: 12, lineHeight: 17,
    color: colors.textSecondary,
  },
  progressBox: { marginHorizontal: 16, marginBottom: 12, gap: 6 },
  progressText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.skeleton, overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.success },
  empty: { textAlign: 'center', padding: 24, opacity: 0.6 },
}));
