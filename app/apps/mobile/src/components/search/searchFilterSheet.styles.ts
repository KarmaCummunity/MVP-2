// Styles for SearchFilterSheet.
import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

export const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  clearText: { ...typography.caption, color: colors.primary, fontWeight: '600' as const },
  body: { flex: 1 },
  bodyContent: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '500' as const },
  chipTextActive: { color: colors.textInverse },
  footer: { padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  applyBtnPressed: { backgroundColor: colors.primaryDark },
  applyBtnText: { ...typography.button, color: colors.textInverse },
});
