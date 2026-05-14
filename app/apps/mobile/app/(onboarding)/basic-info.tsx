// Onboarding step 1 — FR-AUTH-010
import React from 'react';
import {
  View, Text, TextInput,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { EditProfileAddressBlock } from '../../src/components/EditProfileAddressBlock';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { useOnboardingBasicInfoFlow } from '../../src/hooks/useOnboardingBasicInfoFlow';
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';

export default function OnboardingBasicInfoScreen() {
  const { t } = useTranslation();
  const {
    displayName, setDisplayName, city, setCity, street, setStreet, streetNumber, setStreetNumber,
    loading, hasRequiredFields, canSubmit, handleBack, handleContinue, handleSkip,
  } = useOnboardingBasicInfoFlow();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingStepHeader
              step={2}
              onSkip={handleSkip}
              onBack={handleBack}
              skipDisabled={loading}
              backDisabled={loading}
            />
            <AnimatedEntry delay={staggerDelay(0)}>
              <Text style={styles.title}>פרטים בסיסיים</Text>
            </AnimatedEntry>
            <AnimatedEntry delay={staggerDelay(1)}>
              <Text style={styles.subtitle}>{t('onboarding.basicInfoSubtitle')}</Text>
            </AnimatedEntry>

            <AnimatedEntry delay={staggerDelay(2)}>
              <View style={styles.field}>
                <Text style={styles.label}>שם מלא</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="לדוגמה: רינה כהן"
                  placeholderTextColor={colors.textDisabled}
                  maxLength={50}
                  textAlign="right"
                  editable={!loading}
                />
              </View>
            </AnimatedEntry>

            <AnimatedEntry delay={staggerDelay(3)}>
              <EditProfileAddressBlock
                city={city}
                onCityChange={setCity}
                street={street}
                streetNumber={streetNumber}
                onStreetChange={setStreet}
                onStreetNumberChange={setStreetNumber}
                disabled={loading}
              />
            </AnimatedEntry>
          </ScrollView>

          <PressableScale
            style={[
              styles.cta,
              !hasRequiredFields && { opacity: 0.4 },
              hasRequiredFields && !canSubmit && { opacity: 0.85 },
            ]}
            disabled={!hasRequiredFields || loading}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="המשך"
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.ctaText}>המשך</Text>
            )}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: spacing.base, paddingBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  input: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    ...typography.body,
    color: colors.textPrimary,
  },
  cta: {
    height: 52,
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
