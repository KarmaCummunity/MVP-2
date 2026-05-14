import { StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@kc/ui';

export const settingsScreenStyles = StyleSheet.create({
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
  title: { ...typography.h3, color: colors.textPrimary },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
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
  version: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', padding: spacing.xl },
});
