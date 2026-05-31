// FR-RIDE-024 — driver dashboard row styles (extracted from MyRideRow.tsx).
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../../lib/rtlLayout';

export const useMyRideRowStyles = makeUseStyles(({ colors }) => ({
  card: { gap: spacing.sm },
  headerBlock: { gap: 4 },
  topRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeText: { ...typography.caption, color: colors.textSecondary },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  pillText: { ...typography.caption, fontWeight: '600' as const },
  title: {
    ...typography.body,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    width: '100%',
  },
  route: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
  },
  metaRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' as const },
  spacer: { flex: 1 },
  pendingChip: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pendingChipText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700' as const,
  },
  menu: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  menuItemText: { ...typography.body, color: colors.textPrimary },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
}));
