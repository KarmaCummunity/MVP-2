import { Dimensions, I18nManager, Platform, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 2 columns, spacing.base (16) padding on each side, spacing.sm (8) gap between columns
export const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

const isRTL = I18nManager.isRTL;
const isWeb = Platform.OS === 'web';

// The original alignStart was perfectly calibrated for React Native's RTL mirroring quirks:
// On Web RTL, we explicitly need 'right'. On Native RTL, 'left' is mirrored to visual right.
export const alignStart: 'left' | 'right' = isWeb
  ? isRTL
    ? 'left'
    : 'right'
  : isRTL
    ? 'left'
    : 'right';

export const isRtlLayout = isRTL;

export const postCardGridStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
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
  // Opposite corner to typeTag — visual chip so the icon stays readable over any image.
  menuOverlay: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  typeTagText: { ...typography.label, fontSize: 10 },
  giveTagText: { color: colors.giveTag },
  requestTagText: { color: colors.requestTag },
  content: { padding: spacing.sm, gap: 2 },
  titleRow: {
    flexDirection: isRTL ? 'row' : 'row-reverse',
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
});
