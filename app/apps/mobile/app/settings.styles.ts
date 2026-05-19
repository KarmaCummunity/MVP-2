import { makeUseStyles, spacing, typography } from '@kc/ui';
import { rtlTextAlignStart } from '../src/lib/rtlTextAlignStart';

// Settings screen styles — themed via `makeUseStyles` so they respond to
// FR-SETTINGS-014 (dark mode toggle).
export const useSettingsScreenStyles = makeUseStyles(({ colors }) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: rtlTextAlignStart },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  version: { ...typography.caption, color: colors.textDisabled, textAlign: 'center' as const, padding: spacing.xl },
  supportCardWrap: { paddingHorizontal: spacing.base, paddingTop: spacing.base },
}));
