// Donation support card — warm CTA prompting the user to back the platform via
// Bit / Paybox. Embedded on About + Settings. Maps to FR-DONATE-010.
import React, { useCallback } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';

const BIT_URL = 'https://www.bitpay.co.il/app/share-info?i=192485429007_19nlt4Un';
const PAYBOX_URL = 'https://links.payboxapp.com/XR2JbQRxMUb';

export interface DonationSupportCardProps {
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function DonationSupportCard({ style, testID }: DonationSupportCardProps) {
  const { t } = useTranslation();

  const openUrl = useCallback(
    async (url: string) => {
      try {
        const supported = await Linking.canOpenURL(url);
        if (!supported) throw new Error('not-supported');
        await Linking.openURL(url);
      } catch {
        Alert.alert(
          t('donations.supportUs.linkErrorTitle'),
          t('donations.supportUs.linkErrorBody'),
        );
      }
    },
    [t],
  );

  return (
    <View style={[styles.card, style]} testID={testID ?? 'donation-support-card'}>
      <View style={styles.iconBadge}>
        <Ionicons name="heart" size={26} color={colors.textInverse} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {t('donations.supportUs.title')}
      </Text>
      <Text style={styles.tagline}>{t('donations.supportUs.tagline')}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => openUrl(BIT_URL)}
          accessibilityRole="button"
          accessibilityLabel={t('donations.supportUs.ctaBitA11y')}
          activeOpacity={0.85}
          testID="donation-support-card-bit"
        >
          <Text style={[styles.btnText, styles.btnTextPrimary]}>
            {t('donations.supportUs.ctaBit')}
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.textInverse} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => openUrl(PAYBOX_URL)}
          accessibilityRole="button"
          accessibilityLabel={t('donations.supportUs.ctaPayboxA11y')}
          activeOpacity={0.85}
          testID="donation-support-card-paybox"
        >
          <Text style={[styles.btnText, styles.btnTextSecondary]}>
            {t('donations.supportUs.ctaPaybox')}
          </Text>
          <Ionicons name="open-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySurface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'stretch',
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconBadge: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnText: {
    ...typography.button,
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: colors.textInverse,
  },
  btnTextSecondary: {
    color: colors.primary,
  },
});
