// FR-RIDE-034 + FR-RIDE-035 — active ride screen styles (split for size cap).
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../../lib/rtlLayout';

export const useActiveRideScreenStyles = makeUseStyles(({ colors, isDark }) => ({
  centerWrap: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  errorText: { ...typography.body, color: colors.textSecondary },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  titleRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: rtlTextAlignStart,
  },
  titleSpacer: { width: 22 },

  emergencyBanner: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.base,
  },
  emergencyBannerText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700' as const,
    flex: 1,
  },

  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  rideTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
  },
  route: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
  },
  elapsed: {
    ...typography.h1,
    color: colors.primary,
    fontVariant: ['tabular-nums'] as const,
    textAlign: 'center' as const,
    marginVertical: spacing.sm,
  },

  ownerActions: { gap: spacing.sm, marginBottom: spacing.lg },
  primaryBtn: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: radius.full,
  },
  primaryBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
  secondaryBtn: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' as const },
  linkBtn: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  linkBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' as const },

  emergencyBtn: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.lg,
    borderRadius: radius.full,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.4 : 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: spacing.lg,
  },
  emergencyBtnText: { ...typography.h3, color: colors.textInverse, fontWeight: '800' as const },
  btnDisabled: { opacity: 0.55 },
}));
