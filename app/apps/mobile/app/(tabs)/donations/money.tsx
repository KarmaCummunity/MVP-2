// Donations · Money — coming-soon copy + external link to jgive.com.
// Mapped to: FR-DONATE-003 / D-16.
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@kc/ui';

const JGIVE_URL = 'https://jgive.com';

export default function DonationsMoneyScreen() {
  const { t } = useTranslation();

  const openLink = async () => {
    try {
      const supported = await Linking.canOpenURL(JGIVE_URL);
      if (!supported) {
        Alert.alert(t('donations.moneyScreen.linkErrorTitle'), t('donations.moneyScreen.linkErrorBody'));
        return;
      }
      await Linking.openURL(JGIVE_URL);
    } catch {
      Alert.alert(t('donations.moneyScreen.linkErrorTitle'), t('donations.moneyScreen.linkErrorBody'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.body}>{t('donations.moneyScreen.body')}</Text>
        <Pressable
          onPress={openLink}
          accessibilityRole="link"
          accessibilityLabel={t('donations.moneyScreen.openLink')}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>{t('donations.moneyScreen.openLink')}</Text>
          <Ionicons name="open-outline" size={18} color={colors.textInverse} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    maxWidth: 480,
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
});
