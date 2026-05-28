// Prominent About entry on Settings — FR-SETTINGS-001 / About route.
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, radius, spacing, typography, useTheme } from '@kc/ui';

const useStyles = makeUseStyles(({ colors, isDark }) => ({
  card: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: isDark ? colors.border : colors.primaryLight,
    alignItems: 'stretch' as const,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: isDark ? 0 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: isDark ? 0 : 2,
  },
  iconBadge: {
    alignSelf: 'center' as const,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    textAlign: 'center' as const,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  ctaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: isDark ? colors.border : colors.primaryLight,
  },
  cta: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600' as const,
  },
}));

export function SettingsAboutCard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/about')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('settings.aboutCard.a11y')}
      testID="settings-about-card"
    >
      <View style={styles.iconBadge}>
        <Ionicons name="information-circle" size={28} color={colors.textInverse} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {t('settings.aboutCard.title')}
      </Text>
      <Text style={styles.subtitle}>{t('settings.aboutCard.subtitle')}</Text>
      <View style={styles.ctaRow}>
        <Text style={styles.cta}>{t('settings.aboutCard.cta')}</Text>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}
