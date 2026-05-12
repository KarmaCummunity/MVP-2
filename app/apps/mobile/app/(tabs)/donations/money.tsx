// Donations · Money — coming-soon copy + external link to jgive.com + community NGO links list.
// Mapped to: FR-DONATE-003 (top section) / FR-DONATE-007..009 (list section) / D-16.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@kc/ui';
import { DonationLinksList } from '../../../src/components/DonationLinksList';
import { openExternalUrl } from '../../../src/utils/openExternalUrl';

export default function DonationsMoneyScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.body}>{t('donations.moneyScreen.body')}</Text>
        <Pressable
          onPress={() => {
            openExternalUrl('https://jgive.com');
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('donations.moneyScreen.openLink')}
        >
          <Text style={styles.ctaText}>{t('donations.moneyScreen.openLink')}</Text>
          <Ionicons name="open-outline" size={18} color={colors.textInverse} />
        </Pressable>
        <View style={styles.divider} />
        <DonationLinksList categorySlug="money" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 26,
  },
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  ctaPressed: { backgroundColor: colors.primaryDark },
  ctaText: {
    ...typography.button,
    color: colors.textInverse,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
