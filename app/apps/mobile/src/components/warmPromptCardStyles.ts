// Shared style primitives for "warm prompt" cards rendered on Settings / About
// (DonationSupportCard, SettingsAboutCard, future siblings). Same visual
// language: primary-tinted surface with a circular icon badge, centered title,
// short body line. Each consumer composes these into its own `useStyles` via
// `makeUseStyles` and adds its own action row / buttons on top.
import { radius, spacing, typography } from '@kc/ui';
import type { TextStyle, ViewStyle } from 'react-native';

type WarmCardTheme = Readonly<{
  colors: {
    primarySurface: string;
    border: string;
    primaryLight: string;
    shadow: string;
    primary: string;
    textPrimary: string;
    textSecondary: string;
  };
  isDark: boolean;
}>;

export type WarmPromptCardBase = Readonly<{
  card: ViewStyle;
  iconBadge: ViewStyle;
  title: TextStyle;
  bodyLine: TextStyle;
}>;

export function warmPromptCardBase({ colors, isDark }: WarmCardTheme): WarmPromptCardBase {
  return {
    card: {
      backgroundColor: colors.primarySurface,
      borderRadius: radius.xl,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? colors.border : colors.primaryLight,
      alignItems: 'stretch',
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: isDark ? 0 : 2,
    },
    iconBadge: {
      alignSelf: 'center',
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      shadowColor: colors.primary,
      shadowOpacity: isDark ? 0 : 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: isDark ? 0 : 4,
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    bodyLine: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  };
}
