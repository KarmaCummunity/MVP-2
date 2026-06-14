// FR-ADMIN-021 — prominent banner: legal requirements for the institutions step.
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GovernanceValidation } from '@kc/domain';
import { makeUseStyles, useTheme } from '@kc/ui';
import he from '../../../i18n/locales/he';

export function ValidationBanner({ validation }: { validation: GovernanceValidation }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = he.admin.orgFormation.validation;
  const criticals = validation.violations.filter((v) => v.severity === 'critical');
  const warnings = validation.violations.filter((v) => v.severity === 'warning');
  const satisfied = validation.isGateSatisfied;

  return (
    <View style={[styles.root, satisfied ? styles.ok : styles.blocked]}>
      <View style={styles.headerRow}>
        <Ionicons
          name={satisfied ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={satisfied ? colors.success : colors.error}
        />
        <Text style={styles.title}>{t.title}</Text>
      </View>
      <Text style={styles.counts}>{t.countsLabel(validation.boardCount, validation.auditCount)}</Text>

      {satisfied && warnings.length === 0 && <Text style={styles.okText}>{t.gateOk}</Text>}

      {criticals.map((v) => (
        <View key={v.code} style={styles.ruleRow}>
          <Text style={[styles.badge, styles.badgeCritical]}>{t.critical}</Text>
          <Text style={styles.ruleText}>{t.rules[v.code]}</Text>
        </View>
      ))}
      {warnings.map((v) => (
        <View key={v.code} style={styles.ruleRow}>
          <Text style={[styles.badge, styles.badgeWarning]}>{t.warning}</Text>
          <Text style={styles.ruleText}>{t.rules[v.code]}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  ok: { backgroundColor: colors.successLight, borderColor: colors.success },
  blocked: { backgroundColor: colors.errorLight, borderColor: colors.error },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  counts: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  okText: { fontSize: 13, color: colors.textPrimary },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badge: {
    fontSize: 10, fontWeight: '800', color: colors.textInverse,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  badgeCritical: { backgroundColor: colors.error },
  badgeWarning: { backgroundColor: colors.warning },
  ruleText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
}));
