// Styles for AddDonationLinkModal — extracted to keep the component file under 200 LOC.
import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

export const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
  },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.sm },
  label: { ...typography.body, color: colors.textSecondary, textAlign: 'right', marginTop: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputUrl: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  inputMulti: { minHeight: 80 },
  helper: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  errorText: {
    ...typography.body,
    color: '#B91C1C',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { ...typography.button, color: colors.textInverse },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { ...typography.body, color: colors.textPrimary },
  submittingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
});
