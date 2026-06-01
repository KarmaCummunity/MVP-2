// FR-RIDE-023 — rides hub styles (extracted from RidesHubScreen.tsx).
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../../lib/rtlLayout';

export const useRidesHubStyles = makeUseStyles(({ colors, isDark }) => ({
  headerExtraRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: 4,
  },
  headerIconBtn: { padding: spacing.xs },

  searchRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
    textAlign: rtlTextAlignStart,
  },
  filterBtn: {
    padding: spacing.sm,
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700' as const,
  },

  bannerWrap: {
    alignItems: 'center' as const,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  banner: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.25,
    shadowRadius: 10,
    elevation: isDark ? 0 : 4,
  },
  bannerText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700' as const,
  },

  listContent: { paddingHorizontal: spacing.base },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center' as const },
  separator: { height: spacing.sm },

  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  emptyCta: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  emptyCtaText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700' as const,
  },
  emptyLinksRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  emptyLinksText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
  },

  fab: {
    position: 'absolute' as const,
    end: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
}));
