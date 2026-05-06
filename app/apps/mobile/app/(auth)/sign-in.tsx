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
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';
import { getSignInUseCase } from '../../src/services/authComposition';
import { useAuthStore } from '../../src/store/authStore';

export default function SignInScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'יש למלא דוא"ל וסיסמה');
      return;
    }
    setLoading(true);
    try {
      const { session } = await getSignInUseCase().execute({ email, password });
      setSession(session);
      router.replace('/(tabs)');
    } catch (err) {
      const message = isAuthError(err)
        ? mapAuthErrorToHebrew(err.code)
        : 'שגיאת רשת. נסה שוב.';
      Alert.alert('כניסה נכשלה', message);
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
            <Text style={styles.backText}>← חזרה</Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>כניסה לחשבון</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>דוא"ל</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder='הכנס דוא"ל'
                placeholderTextColor={colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>סיסמה</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="הכנס סיסמה"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry
                textAlign="right"
                editable={!loading}
              />
            </View>

            <TouchableOpacity disabled={loading}>
              <Text style={styles.forgotText}>שכחתי סיסמה</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>כניסה</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => router.push('/(auth)/sign-up')}
            disabled={loading}
          >
            <Text style={styles.switchModeText}>אין לי חשבון עדיין — הרשמה</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
