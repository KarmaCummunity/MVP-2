import { StyleSheet } from 'react-native';
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';

export const useRideCreateSheetStyles = makeUseStyles(({ colors }) => ({
  overlay: { flex: 1, justifyContent: 'flex-end' as const },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    paddingBottom: spacing.lg,
  },
  scroll: { padding: spacing.base, gap: spacing.md },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    justifyContent: 'flex-end' as const,
  },
  departsValue: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
  },
  seatsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.lg,
    alignSelf: 'center' as const,
  },
  seatBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySurface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  seatBtnText: { ...typography.h3, color: colors.primary },
  seatsValue: { ...typography.h2, color: colors.textPrimary, minWidth: 32, textAlign: 'center' as const },
  input: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
  },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center' as const,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { ...typography.button, color: colors.textInverse },
  backLink: { alignItems: 'center' as const, paddingVertical: spacing.sm },
  backLinkText: { ...typography.caption, color: colors.primary },
  errorText: { ...typography.caption, color: colors.error, textAlign: rtlTextAlignStart },
}));
