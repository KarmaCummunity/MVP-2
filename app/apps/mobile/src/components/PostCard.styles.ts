import { I18nManager, Platform, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';

const isRTL = I18nManager.isRTL;
const isWeb = Platform.OS === 'web';
const alignStart: 'left' | 'right' = isWeb ? (isRTL ? 'right' : 'left') : 'left';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  authorInfo: {
    marginRight: spacing.sm,
    flex: 1,
  },
  authorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: alignStart,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: alignStart,
  },
  typeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  giveTag: {
    backgroundColor: colors.giveTagBg,
  },
  requestTag: {
    backgroundColor: colors.requestTagBg,
  },
  typeTagText: {
    ...typography.label,
  },
  giveTagText: {
    color: colors.giveTag,
  },
  requestTagText: {
    color: colors.requestTag,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: alignStart,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: alignStart,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dot: {
    color: colors.textDisabled,
    marginHorizontal: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  messageBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: 16,
  },
  visibilityBadge: { marginTop: spacing.sm, alignSelf: 'flex-end' },
  visibilityText: { ...typography.caption, color: colors.followersOnlyBadge },
});
