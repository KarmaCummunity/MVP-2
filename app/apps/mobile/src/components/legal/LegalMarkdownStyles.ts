import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { typography, spacing, type ColorPalette } from '@kc/ui';

// Style map consumed by react-native-markdown-display.
// Keys come from the library's internal renderer node names.
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
      textAlign: 'right',
    } as TextStyle,
    heading2: {
      ...typography.h3,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      textAlign: 'right',
    } as TextStyle,
    heading3: {
      ...typography.h4,
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: 'right',
    } as TextStyle,
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    } as TextStyle,
    list_item: {
      flexDirection: 'row-reverse',
      marginBottom: spacing.xs,
    } as ViewStyle,
    bullet_list_icon: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      marginRight: 0,
    } as TextStyle,
    ordered_list_icon: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      marginRight: 0,
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
    } as TextStyle,
    em: {
      ...typography.body,
      fontStyle: 'italic',
    } as TextStyle,
  });
}
