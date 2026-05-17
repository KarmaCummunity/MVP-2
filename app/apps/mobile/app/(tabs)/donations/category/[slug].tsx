// FR-DONATE-006/007 — generic donation category screen.
// Renders DonationLinksList for any of: food, housing, transport, knowledge, animals, medical.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  DONATION_CATEGORY_SLUGS,
  type DonationCategorySlug,
} from '@kc/domain';
import { colors, spacing, typography } from '@kc/ui';
import type { Ionicons } from '@expo/vector-icons';
import { DonationLinksList } from '../../../../src/components/DonationLinksList';
import { Screen } from '../../../../src/components/ui/Screen';
import { IconTile } from '../../../../src/components/ui/IconTile';
import { MotionEntry, ENTRY_DELAY } from '../../../../src/components/ui/MotionEntry';

const ICON_BY_SLUG: Record<DonationCategorySlug, keyof typeof Ionicons.glyphMap> = {
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
  const body = t(`donations.categories.${titleKey}.body`);
  const iconName = ICON_BY_SLUG[slug];

  return (
    <Screen blobs="content" edges={['bottom']}>
      <ScrollView
        style={styles.scrollOuter}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.hero}>
          <View style={styles.heroIcon}><IconTile icon={iconName} size="lg" /></View>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
          <Text style={styles.body}>{body}</Text>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section + 80}>
          <DonationLinksList categorySlug={slug} />
        </MotionEntry>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollOuter: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroIcon: { marginBottom: spacing.xs },
  heroTitle: {
    ...typography.h1,
    fontSize: 28,
    color: '#1C1917',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyLarge,
    color: '#1C1917',
    textAlign: 'right',
    lineHeight: 26,
    width: '100%',
  },
});
