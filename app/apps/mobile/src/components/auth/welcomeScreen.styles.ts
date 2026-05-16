import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

const ORANGE = '#F97316';

export const welcomeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },

  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  logoRingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: ORANGE,
  },
  logo: {
    width: 108,
    height: 108,
    borderRadius: 24,
  },
  appName: {
    ...typography.h1,
    fontSize: 32,
    color: '#1C1917',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Value props ───────────────────────────────────────────────────────
  valueProps: {
    marginBottom: spacing['2xl'],
    gap: spacing.base,
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  valuePropIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePropText: {
    ...typography.body,
    color: '#1C1917',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },

  // ── Buttons ───────────────────────────────────────────────────────────
  buttons: {
    gap: spacing.sm,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: radius.xl,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  authBtnIconWrap: {
    position: 'absolute',
    right: spacing.lg,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBtnText: {
    ...typography.button,
    fontSize: 16,
    textAlign: 'center',
  },
  authBtnDisabled: { opacity: 0.6 },

  // Google: white card
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  googleBtnText: { color: '#1C1917' },
  googleGLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },

  // Apple: deep black
  appleBtn: { backgroundColor: '#000000' },
  appleBtnText: { color: '#FFFFFF' },

  // Guest: ghost
  guestBtn: {
    marginTop: spacing.xs,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  guestBtnText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // ── Legal ─────────────────────────────────────────────────────────────
  legal: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
