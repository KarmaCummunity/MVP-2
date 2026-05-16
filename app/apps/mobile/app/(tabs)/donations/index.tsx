// Donations Hub — featured "items" tile + 8 categorized tiles in a 2-column grid.
// Mapped to: FR-DONATE-001 / FR-DONATE-006 / D-16.
//
// Visual hierarchy (mobile-first):
//   1. Hero with title + tagline ("Give. Take. Donate what you have.")
//   2. Featured row card for "items" — the MVP's primary action (FR-DONATE-001).
//   3. Section heading + 2-column grid for the eight category tiles.
//
// Each tile uses the shared Card + IconTile primitives so it stays in lock-step
// with the rest of the redesigned main-screen idiom (welcome-style cream
// backdrop, soft shadow, orange-tinted icon tiles, staggered spring entries).
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';
import { TopBar } from '../../../src/components/TopBar';
import { PressableScale } from '../../../src/components/animations/PressableScale';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { IconTile } from '../../../src/components/ui/IconTile';
import { MotionEntry, ENTRY_DELAY } from '../../../src/components/ui/MotionEntry';

interface CategoryTile {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  href: string;
  testID: string;
}

// `items` is rendered as a featured row above the grid — it leads the MVP flow.
const FEATURED: CategoryTile = {
  key: 'items',
  icon: 'gift',
  titleKey: 'donations.hubItemsFeaturedTitle',
  subtitleKey: 'donations.hubItemsFeaturedSubtitle',
  href: '/(tabs)',
  testID: 'donation-tile-items',
};

const TILES: CategoryTile[] = [
  { key: 'time',      icon: 'time-outline',       titleKey: 'donations.time.title',                 subtitleKey: 'donations.time.subtitle',                  href: '/(tabs)/donations/time',               testID: 'donation-tile-time' },
  { key: 'money',     icon: 'cash-outline',       titleKey: 'donations.money.title',                subtitleKey: 'donations.money.subtitle',                 href: '/(tabs)/donations/money',              testID: 'donation-tile-money' },
  { key: 'food',      icon: 'restaurant-outline', titleKey: 'donations.categories.food.title',      subtitleKey: 'donations.categories.food.subtitle',       href: '/(tabs)/donations/category/food',      testID: 'donation-tile-food' },
  { key: 'housing',   icon: 'home-outline',       titleKey: 'donations.categories.housing.title',   subtitleKey: 'donations.categories.housing.subtitle',    href: '/(tabs)/donations/category/housing',   testID: 'donation-tile-housing' },
  { key: 'transport', icon: 'car-outline',        titleKey: 'donations.categories.transport.title', subtitleKey: 'donations.categories.transport.subtitle',  href: '/(tabs)/donations/category/transport', testID: 'donation-tile-transport' },
  { key: 'knowledge', icon: 'school-outline',     titleKey: 'donations.categories.knowledge.title', subtitleKey: 'donations.categories.knowledge.subtitle',  href: '/(tabs)/donations/category/knowledge', testID: 'donation-tile-knowledge' },
  { key: 'animals',   icon: 'paw-outline',        titleKey: 'donations.categories.animals.title',   subtitleKey: 'donations.categories.animals.subtitle',    href: '/(tabs)/donations/category/animals',   testID: 'donation-tile-animals' },
  { key: 'medical',   icon: 'medical-outline',    titleKey: 'donations.categories.medical.title',   subtitleKey: 'donations.categories.medical.subtitle',    href: '/(tabs)/donations/category/medical',   testID: 'donation-tile-medical' },
];

export default function DonationsHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Pair grid tiles into rows of 2 — single row when count is odd.
  const rows: CategoryTile[][] = [];
  for (let i = 0; i < TILES.length; i += 2) {
    rows.push(TILES.slice(i, i + 2));
  }

  return (
    <Screen blobs="content">
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────── */}
        <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.heroBlock}>
          <Text style={styles.heroTitle}>{t('donations.hubHeroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('donations.hubHeroSubtitle')}</Text>
        </MotionEntry>

        {/* ── Featured: items ──────────────── */}
        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
          <PressableScale
            onPress={() => router.push(FEATURED.href as Parameters<typeof router.push>[0])}
            accessibilityRole="button"
            accessibilityLabel={`${t(FEATURED.titleKey)} — ${t(FEATURED.subtitleKey)}`}
          >
            <Card padding="lg" style={styles.featuredCard} testID={FEATURED.testID}>
              <View style={styles.featuredIcon}>
                <IconTile icon={FEATURED.icon} size="lg" />
              </View>
              <View style={styles.featuredText}>
                <Text style={styles.featuredTitle}>{t(FEATURED.titleKey)}</Text>
                <Text style={styles.featuredSubtitle}>{t(FEATURED.subtitleKey)}</Text>
              </View>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Card>
          </PressableScale>
        </MotionEntry>

        {/* ── Category grid ────────────────── */}
        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section + 80}>
          <Text style={styles.gridHeading}>{t('donations.hubCategoriesSectionTitle')}</Text>
        </MotionEntry>

        <View style={styles.grid}>
          {rows.map((pair, rowIdx) => (
            <MotionEntry
              key={rowIdx}
              variant="bottom"
              delay={ENTRY_DELAY.buttons + rowIdx * 80}
            >
              <View style={styles.row}>
                {pair.map((cat) => (
                  <PressableScale
                    key={cat.key}
                    onPress={() => router.push(cat.href as Parameters<typeof router.push>[0])}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(cat.titleKey)} — ${t(cat.subtitleKey)}`}
                    style={styles.gridPressable}
                  >
                    <Card padding="md" style={styles.gridCard} testID={cat.testID}>
                      <IconTile icon={cat.icon} size="lg" />
                      <Text style={styles.gridTitle} numberOfLines={1}>
                        {t(cat.titleKey)}
                      </Text>
                      <Text style={styles.gridSubtitle} numberOfLines={2}>
                        {t(cat.subtitleKey)}
                      </Text>
                    </Card>
                  </PressableScale>
                ))}
                {pair.length === 1 ? <View style={styles.spacer} /> : null}
              </View>
            </MotionEntry>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Hero — large title + subtitle, mirrors the welcome screen scale.
  heroBlock: { paddingTop: spacing.lg, paddingBottom: spacing.xl, alignItems: 'flex-end' },
  heroTitle: {
    ...typography.h1,
    fontSize: 30,
    color: '#1C1917',
    letterSpacing: -0.5,
    textAlign: 'right',
    lineHeight: 38,
  },
  heroSubtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Featured items row — bigger surface, chevron in primary so it feels like a primary CTA.
  featuredCard: {
    minHeight: 96,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primarySurface,
    marginBottom: spacing.xl,
  },
  featuredIcon: { marginEnd: spacing.xs },
  featuredText: { flex: 1 },
  featuredTitle: {
    ...typography.h2,
    color: '#1C1917',
    textAlign: 'right',
    marginBottom: 2,
  },
  featuredSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Grid — section heading then 2-col cards.
  gridHeading: {
    ...typography.h3,
    color: '#1C1917',
    textAlign: 'right',
    marginBottom: spacing.base,
  },
  grid: { gap: spacing.base },
  row: { flexDirection: 'row-reverse', gap: spacing.base },
  gridPressable: { flex: 1 },
  gridCard: {
    minHeight: 156,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  gridTitle: {
    ...typography.body,
    fontWeight: '700' as const,
    color: '#1C1917',
    textAlign: 'center',
    fontSize: 16,
  },
  gridSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  spacer: { flex: 1 },
});
