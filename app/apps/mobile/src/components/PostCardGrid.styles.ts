import { Dimensions, I18nManager } from 'react-native';
import { makeUseStyles, radius, shadow, spacing, typography } from '@kc/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 2 columns, spacing.base (16) padding on each side, spacing.sm (8) gap between columns
export const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

const isRTL = I18nManager.isRTL;

/** Text alignment toward reading start; mirrors native RTL via I18nManager. */
export const alignStart: 'left' | 'right' = isRTL ? 'left' : 'right';

export const usePostCardGridStyles = makeUseStyles(({ colors, isDark }) => ({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent',
    ...shadow.card,
    shadowOpacity: isDark ? 0 : shadow.card.shadowOpacity,
    elevation: isDark ? 0 : shadow.card.elevation,
  },
  imageArea: {
    width: '100%',
    height: CARD_WIDTH * 0.7,
    backgroundColor: colors.skeleton,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  // Opposite corner to typeTag — icon-only hit target (no background chip).
  menuOverlay: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTagText: { ...typography.label, fontSize: 10 },
  giveTagText: { color: colors.giveTag },
  requestTagText: { color: colors.requestTag },
  content: { padding: spacing.sm, gap: 2 },
  // Always `row`: title first in DOM = flex-start, category = flex-end.
  // Native RTL mirrors `row`; web uses `document.documentElement.dir` (`_layout.tsx`).
  // `row-reverse` while `I18nManager.isRTL` is false at StyleSheet load + `dir=rtl`
  // on web double-flips — category chip sticks to the visual right (see TabBar note).
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: alignStart,
    fontSize: 13,
    flex: 1,
  },
  categoryTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    flexShrink: 0,
  },
  categoryTagText: { ...typography.label, fontSize: 10, color: colors.primary },
  metaContainerText: { textAlign: alignStart, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textSecondary },
  metaDot: { ...typography.caption, color: colors.textSecondary },
  location: { ...typography.caption, color: colors.textSecondary, textAlign: alignStart },
}));
