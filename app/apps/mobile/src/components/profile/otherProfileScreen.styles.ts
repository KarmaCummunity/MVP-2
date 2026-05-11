import { StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';

const S = spacing;

export const otherProfileScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { padding: S.xl, alignItems: 'center', gap: S.sm },
  notFoundText: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  unavailableHint: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  card: { margin: S.base, backgroundColor: colors.surface, borderRadius: radius.lg, padding: S.base, ...shadow.card, gap: S.base },
  actionRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  btnFlex: { flex: 1 },
  msgBtn: {
    flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: S.md, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: S.xs,
  },
  msgBtnText: { ...typography.button, color: colors.textPrimary },
});
