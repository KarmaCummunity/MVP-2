// Styles for AddDonationLinkModal — extracted to keep the component file under 200 LOC.
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import { rtlTextAlignStart } from '../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../lib/rtlLayout';

export const useAddDonationLinkModalStyles = makeUseStyles(({ colors, isDark }) => ({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' as const },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    borderWidth: isDark ? 1 : 0,
    borderBottomWidth: 0,
    borderColor: isDark ? colors.border : 'transparent',
  },
  scroll: { padding: spacing.lg, gap: spacing.sm },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    writingDirection: 'rtl' as const,
  },
  inputUrl: {
    textAlign: 'left' as const,
    writingDirection: 'ltr' as const,
  },
  inputMulti: { minHeight: 80 },
  helper: { ...typography.caption, color: colors.textDisabled, textAlign: rtlTextAlignStart },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: rowDirectionStart,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center' as const,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { ...typography.button, color: colors.textInverse },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { ...typography.body, color: colors.textPrimary },
  submittingRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
}));
