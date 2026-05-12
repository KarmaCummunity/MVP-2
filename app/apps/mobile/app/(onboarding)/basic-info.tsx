// Onboarding step 1 — FR-AUTH-010
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { EditProfileAddressBlock } from '../../src/components/EditProfileAddressBlock';
import { useAuthStore } from '../../src/store/authStore';
import { getCompleteBasicInfoUseCase, markBasicInfoSkipped } from '../../src/services/userComposition';
import { mapEditProfileSaveError } from '../../src/lib/editProfileSaveErrors';

export default function OnboardingBasicInfoScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [displayName, setDisplayName] = useState(session?.displayName ?? '');
  const [city, setCity] = useState<{ id: string; name: string } | null>(null);
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = displayName.trim().length > 0 && city !== null;

  const handleContinue = async () => {
    if (!session) return;
    if (!canContinue || !city) {
      Alert.alert('שגיאה', 'יש למלא שם ועיר');
      return;
    }
    setLoading(true);
    try {
      await getCompleteBasicInfoUseCase().execute({
        userId: session.userId,
        displayName,
        cityId: city.id,
        cityName: city.name,
        profileStreet: street,
        profileStreetNumber: streetNumber,
      });
      setOnboardingState('pending_avatar');
      router.replace('/(onboarding)/photo');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', mapEditProfileSaveError(raw));
    } finally {
      setLoading(false);
    }
  };

  // FR-AUTH-010 AC3: Skip advances to step 2; onboarding_state stays pending_basic_info
  // for FR-AUTH-015 soft gate. basic_info_skipped (server) prevents AuthGate from
  // reopening the full wizard on every cold start / app update.
  const handleSkip = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await markBasicInfoSkipped(session.userId);
      useAuthStore.getState().setBasicInfoSkipped(true);
      router.replace('/(onboarding)/photo');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', mapEditProfileSaveError(raw));
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.headerRow}>
              <Text style={styles.step}>שלב 1 מתוך 3</Text>
              <TouchableOpacity onPress={handleSkip} disabled={loading} accessibilityRole="button">
                <Text style={styles.skip}>דלג</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>פרטים בסיסיים</Text>
            <Text style={styles.subtitle}>
              איך נכיר אותך? בחרו עיר מהרשימה; אפשר להוסיף רחוב ומספר בית (אופציונלי).
            </Text>

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

            <EditProfileAddressBlock
              city={city}
              onCityChange={setCity}
              street={street}
              streetNumber={streetNumber}
              onStreetChange={setStreet}
              onStreetNumberChange={setStreetNumber}
              disabled={loading}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.cta, !canContinue && { opacity: 0.4 }]}
            disabled={!canContinue || loading}
            onPress={handleContinue}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.ctaText}>המשך</Text>
            )}
          </TouchableOpacity>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  skip: { ...typography.body, color: colors.primary },
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
