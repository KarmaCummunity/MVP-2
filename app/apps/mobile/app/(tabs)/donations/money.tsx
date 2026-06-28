// Donations · Money — coming-soon copy + external link to jgive.com + community NGO links list.
// Mapped to: FR-DONATE-003 (top section) / FR-DONATE-007..009 (list section) / D-16.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography } from '@kc/ui';
import { DonationLinksList } from '../../../src/components/DonationLinksList';
import { Screen } from '../../../src/components/ui/Screen';
import { IconTile } from '../../../src/components/ui/IconTile';
import { MotionEntry, ENTRY_DELAY } from '../../../src/components/ui/MotionEntry';
import { useShellTabBarScrollInset } from '../../../src/navigation/useShellTabBarVisibility';
import { rtlTextAlignStart } from '../../../src/lib/rtlTextAlignStart';

const useStyles = makeUseStyles(({ colors }) => ({
  scrollView: { flex: 1 },
  // `paddingBottom` is supplied dynamically by `useShellTabBarScrollInset()`
  // so the last link clears the floating tab-bar pill (FR-RESP-006).
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center' as const,
    gap: spacing.lg,
  },
  hero: { alignItems: 'center' as const, gap: spacing.md },
  heroIcon: { marginBottom: spacing.xs },
  body: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    lineHeight: 26,
    width: '100%',
  },
}));

export default function DonationsMoneyScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const tabBarPad = useShellTabBarScrollInset();

  return (
    <Screen blobs="content">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPad }]}
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
