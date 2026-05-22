import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, typography, spacing, radius, useTheme } from '@kc/ui';
import { BackButton } from '../src/components/BackButton';
import { rtlTextAlignStart } from '../src/lib/rtlTextAlignStart';
import { webTextRtl, webViewRtl } from '../src/lib/webRtlStyle';

export default function LegalScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton tintColor={colors.primary} />
        <Text style={styles.title}>{t('legalContent.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contentBox}>
          <Text style={styles.lastUpdated}>{t('legalContent.lastUpdated')}</Text>

          <Text style={styles.sectionTitle}>{t('legalContent.termsTitle')}</Text>
          <Text style={styles.paragraph}>{t('legalContent.termsText')}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('legalContent.privacyTitle')}</Text>
          <Text style={styles.paragraph}>{t('legalContent.privacyText')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  container: { flex: 1, backgroundColor: colors.background, ...webViewRtl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...webViewRtl,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  scroll: { padding: spacing.base, paddingBottom: spacing['3xl'], ...webViewRtl },
  contentBox: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    ...webViewRtl,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginBottom: spacing.lg,
    ...webTextRtl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginBottom: spacing.sm,
    width: '100%',
    ...webTextRtl,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    lineHeight: 24,
    ...webTextRtl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
}));
