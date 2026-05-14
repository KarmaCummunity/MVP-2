// Email verification landing route — FR-AUTH-006 (MVP gate).
// Receives `?token_hash=...&type=signup` from Supabase's confirmation URL,
// exchanges the token for a session, and lets AuthGate route to onboarding/tabs.
// Sibling of auth/callback.tsx (OAuth code exchange).
// docs/SSOT/spec/01_auth_and_onboarding.md
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, typography } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { getVerifyEmailUseCase } from '../../src/services/authComposition';
import { useAuthStore } from '../../src/store/authStore';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';

export default function AuthVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : undefined;

  useEffect(() => {
    if (!tokenHash) {
      setError('קישור האימות אינו תקין.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { session } = await getVerifyEmailUseCase().execute({ tokenHash });
        if (cancelled) return;
        setSession(session);
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          window.opener &&
          !window.opener.closed
        ) {
          window.close();
        }
      } catch (err) {
        if (cancelled) return;
        const msg = isAuthError(err)
          ? mapAuthErrorToHebrew(err.code)
          : 'הקישור פג תוקף או כבר מומש. נסה להתחבר.';
        setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenHash, setSession]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>האימות לא הצליח</Text>
        <Text style={styles.body}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={styles.btnText}>חזרה למסך הכניסה</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.body}>מאמת…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  btn: {
    marginTop: spacing.lg, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12,
  },
  btnText: { ...typography.button, color: colors.textInverse },
});
