import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { typography, spacing, type ColorPalette } from '@kc/ui';
import { rowDirectionStart } from '../../lib/rtlLayout';

// Style map consumed by react-native-markdown-display.
// Keys come from the library's internal renderer node names.
//
// Hebrew RTL notes:
//   - Every text-bearing node needs both `textAlign: 'right'` and
//     `writingDirection: 'rtl'`. The first forces alignment on web (where
//     RN-Web doesn't always inherit `direction: rtl` to the textAlign
//     resolution); the second nails RTL bidi rendering on iOS for mixed
//     Hebrew/Latin runs (URLs, "GDPR", emails).
//   - `list_item` uses the shared `rowDirectionStart` (native='row',
//     web='row-reverse'). Writing 'row-reverse' directly on native is a
//     *double flip* under I18nManager.forceRTL and lands the bullet on
//     the LEFT.
//   - List-icon spacing uses logical `marginEnd` so the gap always sits
//     between the bullet (start edge) and the body (after it), regardless
//     of platform.
export function makeLegalMarkdownStyles(colors: ColorPalette) {
  return StyleSheet.create({
    body: {
      ...typography.body,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    paragraph: {
      ...typography.body,
      color: colors.textPrimary,
      marginBottom: spacing.md,
      writingDirection: 'rtl',
      textAlign: 'right',
      lineHeight: 24,
    } as TextStyle,
    heading1: {
      ...typography.h2,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    heading2: {
      ...typography.h3,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    heading3: {
      ...typography.h4,
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
      writingDirection: 'rtl',
    } as TextStyle,
    list_item: {
      flexDirection: rowDirectionStart,
      marginBottom: spacing.xs,
    } as ViewStyle,
    bullet_list_icon: {
      ...typography.body,
      color: colors.textSecondary,
      marginStart: 0,
      marginEnd: spacing.sm,
      writingDirection: 'rtl',
    } as TextStyle,
    ordered_list_icon: {
      ...typography.body,
      color: colors.textSecondary,
      marginStart: 0,
      marginEnd: spacing.sm,
      writingDirection: 'rtl',
    } as TextStyle,
    bullet_list_content: {
      flex: 1,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    ordered_list_content: {
      flex: 1,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    blockquote: {
      backgroundColor: colors.surfaceRaised,
      borderRightWidth: 3,
      borderLeftWidth: 0,
      borderRightColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginVertical: spacing.sm,
    } as ViewStyle,
    strong: {
      ...typography.body,
      fontWeight: '700',
      writingDirection: 'rtl',
    } as TextStyle,
    em: {
      ...typography.body,
      fontStyle: 'italic',
      writingDirection: 'rtl',
    } as TextStyle,
  });
}
