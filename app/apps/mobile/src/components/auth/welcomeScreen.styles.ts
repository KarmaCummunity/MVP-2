import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

export const welcomeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.base,
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  valueProps: {
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  valuePropEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  valuePropText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  buttons: {
    gap: spacing.sm,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  authBtnEmoji: {
    fontSize: 18,
    position: 'absolute',
    right: spacing.base,
  },
  authBtnText: {
    ...typography.button,
    textAlign: 'center',
  },
  appleBtn: { backgroundColor: '#000000' },
  appleBtnText: { color: '#FFFFFF' },
  googleBtn: { backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.border },
  googleBtnText: { color: colors.textPrimary },
  authBtnDisabled: { opacity: 0.7 },
  guestBtn: {
    marginTop: spacing.xs,
    alignItems: 'center',
    padding: spacing.sm,
  },
  guestBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legal: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
