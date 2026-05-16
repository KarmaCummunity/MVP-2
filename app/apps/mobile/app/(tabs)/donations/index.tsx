// Donations Hub — items + 8 categorized tiles in a 2-column grid.
// Mapped to: FR-DONATE-001 / FR-DONATE-006 / D-16.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { spacing } from '@kc/ui';
import type { Ionicons } from '@expo/vector-icons';
import { DonationTile } from '../../../src/components/DonationTile';
import { TopBar } from '../../../src/components/TopBar';
import { Screen } from '../../../src/components/ui/Screen';
import { SectionHeading } from '../../../src/components/ui/SectionHeading';
import { MotionEntry, ENTRY_DELAY } from '../../../src/components/ui/MotionEntry';

interface CategoryTile {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  href: string;
  testID: string;
}

const TILES: CategoryTile[] = [
  { key: 'items',     icon: 'gift-outline',       titleKey: 'donations.items.title',                subtitleKey: 'donations.items.subtitle',                 href: '/(tabs)',                              testID: 'donation-tile-items' },
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

  // Pair tiles into rows of 2 — single row when count is odd (last row has 1 tile).
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
        <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.headingWrap}>
          <SectionHeading title={t('donations.tabLabel')} align="right" />
        </MotionEntry>

        <View style={styles.grid}>
          {rows.map((pair, rowIdx) => (
            <MotionEntry
              key={rowIdx}
              variant="bottom"
              delay={ENTRY_DELAY.section + rowIdx * 80}
            >
              <View style={styles.row}>
                {pair.map((cat) => (
                  <DonationTile
                    key={cat.key}
                    icon={cat.icon}
                    title={t(cat.titleKey)}
                    subtitle={t(cat.subtitleKey)}
                    onPress={() => router.push(cat.href as Parameters<typeof router.push>[0])}
                    compact
                    testID={cat.testID}
                  />
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
  headingWrap: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  grid: { gap: spacing.base },
  row: { flexDirection: 'row-reverse', gap: spacing.base },
  spacer: { flex: 1 },
});
