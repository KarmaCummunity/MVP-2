// FR-RIDE-002 — rides hub.
// The new in-app rides mechanism (search, feed, filters, FAB, create flow) is
// hidden at the UI level until it is production-ready. While it is hidden we
// fall back to the standard category-style links view that the other donation
// categories use, so users still reach the curated NGO transport links.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography } from '@kc/ui';
import { TopBar } from '../../../components/TopBar';
import { Screen } from '../../../components/ui/Screen';
import { IconTile } from '../../../components/ui/IconTile';
import { MotionEntry, ENTRY_DELAY } from '../../../components/ui/MotionEntry';
import { DonationLinksList } from '../../../components/DonationLinksList';
import { useShellTabBarScrollInset } from '../../../navigation/useShellTabBarVisibility';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';

const useStyles = makeUseStyles(({ colors }) => ({
  scrollOuter: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center' as const,
    gap: spacing.lg,
  },
  hero: { alignItems: 'center' as const, gap: spacing.sm },
  heroIcon: { marginBottom: spacing.xs },
  heroTitle: {
    ...typography.h1,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  body: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    lineHeight: 26,
    width: '100%',
  },
}));

export function RidesHubScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const tabBarPad = useShellTabBarScrollInset();

  const title = t('donations.categories.transport.title');
  const subtitle = t('donations.categories.transport.subtitle');
  const body = t('donations.categories.transport.body');

  return (
    <Screen blobs="content">
      <TopBar />
      <ScrollView
        style={styles.scrollOuter}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.hero}>
          <View style={styles.heroIcon}><IconTile icon="car-outline" size="lg" /></View>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
          <Text style={styles.body}>{body}</Text>
        </MotionEntry>

        <MotionEntry variant="bottom" delay={ENTRY_DELAY.section + 80}>
          <DonationLinksList categorySlug="transport" />
        </MotionEntry>
      </ScrollView>
    </Screen>
  );
}
