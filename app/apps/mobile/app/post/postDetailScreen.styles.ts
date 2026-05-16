// Styles extracted from app/post/[id].tsx to keep the screen under the
// 200-LOC cap (TD-29).
import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.base },
  errorTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 999 },
  retryText: { ...typography.button, color: colors.textInverse },
  imageWrap: { position: 'relative' },
  typeTagOverlay: {
    position: 'absolute', bottom: spacing.base, right: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  menuOverlay: {
    position: 'absolute', top: spacing.sm, start: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.full,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: { ...typography.label, color: colors.textPrimary },
  content: { padding: spacing.base, gap: spacing.sm, backgroundColor: colors.surface },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  category: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  conditionRow: { flexDirection: 'row', alignItems: 'center' },
  conditionLabel: { ...typography.body, color: colors.textSecondary },
  conditionValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  description: { ...typography.body, color: colors.textPrimary, lineHeight: 24, textAlign: 'right', paddingTop: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  locationText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
  timeText: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  authorCity: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  cta: { flexDirection: 'row', padding: spacing.base, gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  messageBtn: { flex: 1, height: 50, backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  messageBtnText: { ...typography.button, color: colors.textInverse },
});
