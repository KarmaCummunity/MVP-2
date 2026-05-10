// FR-DONATE-006/007 — generic donation category screen.
// Renders DonationLinksList for any of: food, housing, transport, knowledge, animals, medical.
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  DONATION_CATEGORY_SLUGS,
  type DonationCategorySlug,
} from '@kc/domain';
import { colors, spacing, typography } from '@kc/ui';
import { DonationLinksList } from '../../../../src/components/DonationLinksList';

const ICON_BY_SLUG: Record<DonationCategorySlug, string> = {
  time: 'time-outline',
  money: 'cash-outline',
  food: 'restaurant-outline',
  housing: 'home-outline',
  transport: 'car-outline',
  knowledge: 'school-outline',
  animals: 'paw-outline',
  medical: 'medical-outline',
};

const I18N_KEY_BY_SLUG: Record<
  Exclude<DonationCategorySlug, 'time' | 'money'>,
  'food' | 'housing' | 'transport' | 'knowledge' | 'animals' | 'medical'
> = {
  food: 'food',
  housing: 'housing',
  transport: 'transport',
  knowledge: 'knowledge',
  animals: 'animals',
  medical: 'medical',
};

function isCategorySlug(value: unknown): value is DonationCategorySlug {
  return typeof value === 'string' && (DONATION_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export default function DonationCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();

  if (!isCategorySlug(slug) || slug === 'time' || slug === 'money') {
    return <Redirect href="/(tabs)/donations" />;
  }

  const titleKey = I18N_KEY_BY_SLUG[slug];
  const title = t(`donations.categories.${titleKey}.title`);
  const subtitle = t(`donations.categories.${titleKey}.subtitle`);
  const iconName = ICON_BY_SLUG[slug] as keyof typeof Ionicons.glyphMap;

  // The Stack header is set in _layout.tsx via a dynamic title; here we render
  // a bigger hero that mirrors the Money/Time screens' visual rhythm.
  const Hero = useMemo(
    () => (
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={40} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
    ),
    [iconName, title, subtitle],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.scroll}>
        {Hero}
        <DonationLinksList categorySlug={slug} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
  heroSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
