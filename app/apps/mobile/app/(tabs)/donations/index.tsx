// Donations Hub — three tiles for the donation modalities.
// Mapped to: FR-DONATE-001 / FR-DONATE-002 / D-16.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@kc/ui';
import { Text } from 'react-native';
import { DonationTile } from '../../../src/components/DonationTile';
import { TopBar } from '../../../src/components/TopBar';

export default function DonationsHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('donations.hubTitle')}</Text>
        <View style={styles.tiles}>
          <DonationTile
            icon="gift-outline"
            title={t('donations.items.title')}
            subtitle={t('donations.items.subtitle')}
            onPress={() => router.push('/(tabs)')}
            testID="donation-tile-items"
          />
          <DonationTile
            icon="time-outline"
            title={t('donations.time.title')}
            subtitle={t('donations.time.subtitle')}
            onPress={() => router.push('/(tabs)/donations/time')}
            testID="donation-tile-time"
          />
          <DonationTile
            icon="cash-outline"
            title={t('donations.money.title')}
            subtitle={t('donations.money.subtitle')}
            onPress={() => router.push('/(tabs)/donations/money')}
            testID="donation-tile-money"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'right',
  },
  tiles: {
    gap: spacing.base,
  },
});
