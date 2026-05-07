// Onboarding step 2 — FR-AUTH-011 (slice A: skip-only stub).
// Full camera + gallery + resize + EXIF + Storage upload ships in P0.3.b.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { useAuthStore } from '../../src/store/authStore';
import { getCompleteOnboardingUseCase } from '../../src/services/userComposition';

export default function OnboardingPhotoScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // FR-AUTH-011 AC3: skip leaves the user with their current avatar (Google
      // avatar from user_metadata, or initial-letter silhouette). The trigger
      // already pre-filled `users.avatar_url` on signup, so no write is needed.
      // We mark onboarding 'completed' before the tour because the tour is
      // non-blocking content (FR-AUTH-012 AC2 — Skip on every slide). If the
      // user kills the app mid-tour they should not re-enter onboarding.
      await getCompleteOnboardingUseCase().execute({ userId: session.userId });
      setOnboardingState('completed');
      router.replace('/(onboarding)/tour');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>שלב 2 מתוך 3</Text>
        <Text style={styles.title}>תמונת פרופיל</Text>
        <Text style={styles.subtitle}>אפשר להוסיף עכשיו או בהמשך</Text>

        <View style={styles.avatarWrap}>
          <AvatarInitials
            name={session?.displayName ?? 'משתמש'}
            avatarUrl={session?.avatarUrl ?? null}
            size={120}
          />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.cta} onPress={handleContinue} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.ctaText}>המשך עם התמונה הנוכחית</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בהגדרות.</Text>
      </View>
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
    gap: spacing.base,
  },
  step: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.xl },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
  hint: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
