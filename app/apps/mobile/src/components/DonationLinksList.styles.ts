import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

export const donationLinksListStyles = StyleSheet.create({
  container: { gap: spacing.md },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnPressed: { opacity: 0.85 },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  empty: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emptyCta: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  emptyCtaPressed: { opacity: 0.85 },
  emptyCtaText: { ...typography.button, color: colors.textInverse },
});
