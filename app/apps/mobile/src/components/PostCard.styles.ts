import { I18nManager, Platform } from 'react-native';
import { makeUseStyles, radius, shadow, spacing, typography } from '@kc/ui';

const isRTL = I18nManager.isRTL;
const isWeb = Platform.OS === 'web';
const alignStart: 'left' | 'right' = isWeb ? (isRTL ? 'right' : 'left') : 'left';

export const usePostCardStyles = makeUseStyles(({ colors, isDark }) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    // Soft hairline in dark mode so cards detach from the matching dark backdrop.
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent',
    ...shadow.card,
    // Card shadow is heavy on dark mode (black on near-black washes out); fade it.
    shadowOpacity: isDark ? 0 : shadow.card.shadowOpacity,
    elevation: isDark ? 0 : shadow.card.elevation,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: spacing.sm,
  },
  authorInfo: {
    marginRight: spacing.sm,
    flex: 1,
  },
  authorName: {
    ...typography.body,
    fontWeight: '600' as const,
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
  estimatedValue: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: alignStart,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messageBtnText: {
    fontSize: 16,
  },
  visibilityBadge: { marginTop: spacing.sm, alignSelf: 'flex-end' as const },
  visibilityText: { ...typography.caption, color: colors.followersOnlyBadge },
}));
