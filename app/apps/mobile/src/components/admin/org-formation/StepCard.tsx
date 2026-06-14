// FR-ADMIN-021 — one formation step: title, status toggle, body, tips, edit.
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FormationStep, FormationStepStatus } from '@kc/domain';
import { makeUseStyles, useTheme } from '@kc/ui';
import he from '../../../i18n/locales/he';

const NEXT: Record<FormationStepStatus, FormationStepStatus> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
};

interface Props {
  readonly step: FormationStep;
  readonly index: number;
  readonly canManage: boolean;
  readonly canEdit: boolean;
  readonly onCycleStatus: (next: FormationStepStatus) => void;
  readonly onEdit: () => void;
}

export function StepCard({ step, index, canManage, canEdit, onCycleStatus, onEdit }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = he.admin.orgFormation;
  const title = t.stepTitles[step.stepKey] ?? step.titleFallback;
  const statusColor =
    step.progressStatus === 'done' ? colors.success
      : step.progressStatus === 'in_progress' ? colors.warning
        : colors.textSecondary;

  return (
    <View style={[styles.card, step.isCriticalGate && styles.gateCard]}>
      <View style={styles.headerRow}>
        <View style={styles.numBadge}><Text style={styles.numText}>{index + 1}</Text></View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {step.isCriticalGate && (
          <Ionicons name="shield-half-outline" size={16} color={colors.error} />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canManage}
        onPress={() => onCycleStatus(NEXT[step.progressStatus])}
        style={[styles.statusPill, { borderColor: statusColor }]}
      >
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {t.stepStatus[step.progressStatus]}
        </Text>
        {canManage && <Text style={styles.cycleHint}>{t.cycleStatusHint}</Text>}
      </Pressable>

      {step.bodyText.length > 0 && <Text style={styles.body}>{step.bodyText}</Text>}

      {step.tips.length > 0 && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsLabel}>{t.tipsLabel}</Text>
          {step.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={14} color={colors.warning} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {canEdit && (
        <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editBtn}>
          <Ionicons name="create-outline" size={14} color={colors.primary} />
          <Text style={styles.editText}>{t.editContentBtn}</Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  card: {
    marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 8,
  },
  gateCard: { borderColor: colors.error, borderWidth: 1.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cycleHint: { fontSize: 10, opacity: 0.5, color: colors.textSecondary },
  body: { fontSize: 13, lineHeight: 19, color: colors.textPrimary },
  tipsBox: { backgroundColor: colors.warningLight, borderRadius: 10, padding: 10, gap: 6 },
  tipsLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.textPrimary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  editText: { fontSize: 12, fontWeight: '600', color: colors.primary },
}));
