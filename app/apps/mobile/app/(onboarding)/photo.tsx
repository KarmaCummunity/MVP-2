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
  const onboardingState = useAuthStore((s) => s.onboardingState);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [loading, setLoading] = useState(false);

  // Tour completion is what flips state to `completed` (FR-AUTH-012 AC3),
  // but we only do that when the user already filled in step 1 (state ===
  // pending_avatar). If they skipped step 1, leave state at pending_basic_info
  // — FR-AUTH-015 soft gate (slice C) will catch them on first meaningful action.
  const finalize = async () => {
    if (!session) return;
    setLoading(true);
    try {
      if (onboardingState === 'pending_avatar') {
        await getCompleteOnboardingUseCase().execute({ userId: session.userId });
        setOnboardingState('completed');
      }
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
        <View style={styles.headerRow}>
          <Text style={styles.step}>שלב 2 מתוך 3</Text>
          <TouchableOpacity onPress={finalize} disabled={loading} accessibilityRole="button">
            <Text style={styles.skip}>דלג</Text>
          </TouchableOpacity>
        </View>
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

        <TouchableOpacity style={styles.cta} onPress={finalize} disabled={loading}>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  skip: { ...typography.body, color: colors.primary },
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
