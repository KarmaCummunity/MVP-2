// Donations · Money — coming-soon copy + external link to jgive.com + community NGO links list.
// Mapped to: FR-DONATE-003 (top section) / FR-DONATE-007..009 (list section) / D-16.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '@kc/ui';
import { DonationLinksList } from '../../../src/components/DonationLinksList';
import { Screen } from '../../../src/components/ui/Screen';
import { IconTile } from '../../../src/components/ui/IconTile';
import { MotionEntry, ENTRY_DELAY } from '../../../src/components/ui/MotionEntry';

export default function DonationsMoneyScreen() {
  const { t } = useTranslation();

  return (
    <Screen blobs="content" edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.hero}>
          <View style={styles.heroIcon}><IconTile icon="cash-outline" size="lg" /></View>
          <Text style={styles.body}>{t('donations.moneyScreen.body')}</Text>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
          <DonationLinksList categorySlug="money" />
        </MotionEntry>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  hero: { alignItems: 'center', gap: spacing.md },
  heroIcon: { marginBottom: spacing.xs },
  body: {
    ...typography.bodyLarge,
    color: '#1C1917',
    textAlign: 'right',
    lineHeight: 26,
    width: '100%',
  },
});
