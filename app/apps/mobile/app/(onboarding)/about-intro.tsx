// Onboarding step 1 of 4 — FR-AUTH-018 (mini about before FR-AUTH-010)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';

export default function OnboardingAboutIntroScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const goBasicInfo = () => {
    router.replace('/(onboarding)/basic-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingStepHeader step={1} onSkip={goBasicInfo} />
        <AnimatedEntry delay={staggerDelay(0)}>
          <Text style={styles.title}>{t('onboarding.aboutIntroTitle')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(1)}>
          <Text style={styles.lead}>{t('aboutContent.tagline')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(2)}>
          <Text style={styles.body}>{t('onboarding.aboutIntroBody')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(3)}>
          <Text style={styles.hint}>{t('onboarding.aboutIntroSettingsHint')}</Text>
        </AnimatedEntry>
        <AnimatedEntry delay={staggerDelay(4)}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        </AnimatedEntry>
      </ScrollView>
      <AnimatedEntry delay={staggerDelay(5)} style={styles.footer}>
        <PressableScale
          style={styles.cta}
          onPress={goBasicInfo}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.continue')}
        >
          <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
        </PressableScale>
      </AnimatedEntry>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  logoWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  logo: { width: 120, height: 120 },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  lead: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
