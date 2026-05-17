// Styles extracted from app/post/[id].tsx to keep the screen under the
// 300-LOC cap (TD-29).
import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.base, backgroundColor: colors.background },
  errorTitle: { ...typography.h3, color: '#1C1917', textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.full },
  retryText: { ...typography.button, color: colors.textInverse },

  // Image carousel "floats" on the cream backdrop with rounded corners + a
  // soft shadow so it reads as the post's hero — no longer a flush rectangle.
  imageWrap: {
    position: 'relative',
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  typeTagOverlay: {
    position: 'absolute', bottom: spacing.base, right: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.full,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  menuOverlay: {
    position: 'absolute',
    top: spacing.sm,
    start: spacing.sm,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },

  // Content card — white surface lifted off the cream with a soft shadow,
  // rounded corners, generous padding. Matches the welcome-screen Card idiom.
  content: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  // Title: bigger, near-black slate, slight letter-spacing reduction.
  title: { ...typography.h2, fontSize: 26, color: '#1C1917', textAlign: 'right', letterSpacing: -0.3, lineHeight: 32 },
  category: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '700',
    textTransform: 'none' as const,
  },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  conditionLabel: { ...typography.body, color: colors.textSecondary },
  conditionValue: { ...typography.body, color: '#1C1917', fontWeight: '600' },
  description: { ...typography.body, color: '#1C1917', lineHeight: 24, textAlign: 'right', paddingTop: spacing.sm },
  // Location row: 28×28 soft-tint icon tile + text, so it matches the
  // welcome-screen value-prop row pattern.
  locationRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  locationIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  locationText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
  timeText: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { ...typography.body, fontWeight: '600', color: '#1C1917', textAlign: 'right' },
  authorCity: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },

  // Floating CTA bar — cream backdrop continues through, primary button is now
  // 56h / radius.xl with a glow shadow so it matches the welcome submit button.
  cta: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  messageBtn: {
    flex: 1,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  messageBtnText: { ...typography.button, fontSize: 16, color: colors.textInverse },
});
