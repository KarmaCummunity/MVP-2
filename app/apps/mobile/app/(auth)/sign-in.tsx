// Sign-in with email/password — FR-AUTH-007 (email path)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';
import { getSignInUseCase } from '../../src/services/authComposition';
import { useAuthStore } from '../../src/store/authStore';
import { VerificationPendingPanel } from '../../src/components/auth/VerificationPendingPanel';
import { NotifyModal } from '../../src/components/NotifyModal';

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // TD-138: Alert.alert is a no-op on react-native-web — surface via NotifyModal.
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setNotify({ title: t('auth.genericErrorTitle'), message: t('auth.fillEmailAndPassword') });
      return;
    }
    setLoading(true);
    try {
      const { session } = await getSignInUseCase().execute({ email, password });
      setSession(session);
      // AuthGate will route to (onboarding) or (tabs) based on onboarding_state.
    } catch (err) {
      if (isAuthError(err) && err.code === 'email_not_verified') {
        setPendingEmail(email.trim().toLowerCase());
        return;
      }
      const message = isAuthError(err)
        ? mapAuthErrorToHebrew(err.code)
        : t('auth.networkError');
      setNotify({ title: t('auth.signInFailedTitle'), message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('auth.backCta')}</Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('auth.signInScreenTitle')}</Text>

          {pendingEmail ? (
            <VerificationPendingPanel
              email={pendingEmail}
              onChangeEmail={() => setPendingEmail(null)}
            />
          ) : null}

          <View style={[styles.form, pendingEmail ? styles.hidden : null]}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                secureTextEntry
                textAlign="right"
                editable={!loading}
              />
            </View>

            <TouchableOpacity disabled={loading}>
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>{t('auth.signIn')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {!pendingEmail ? (
            <TouchableOpacity
              style={styles.switchMode}
              onPress={() => router.replace('/(auth)/sign-up')}
              disabled={loading}
            >
              <Text style={styles.switchModeText}>{t('auth.noAccountSwitchCta')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <NotifyModal visible={notify !== null} title={notify?.title ?? ''} message={notify?.message ?? ''} onDismiss={() => setNotify(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  kav: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  backBtn: { marginBottom: spacing.base },
  backText: { ...typography.body, color: colors.primary },
  logo: { width: 64, height: 64, alignSelf: 'flex-end', marginBottom: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing['2xl'] },
  form: { gap: spacing.base },
  hidden: { display: 'none' },
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
  forgotText: { ...typography.body, color: colors.primary, textAlign: 'right' },
  submitBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { ...typography.button, color: colors.textInverse },
  switchMode: { marginTop: spacing.xl, alignItems: 'center' },
  switchModeText: { ...typography.body, color: colors.primary },
});
