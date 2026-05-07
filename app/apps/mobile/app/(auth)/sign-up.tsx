// Sign-up with email/password — FR-AUTH-006
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { getSignUpUseCase } from '../../src/services/authComposition';
import { useAuthStore } from '../../src/store/authStore';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';

export default function SignUpScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'יש למלא כל השדות');
      return;
    }
    setLoading(true);
    try {
      const { session, pendingVerification } =
        await getSignUpUseCase().execute({ email, password });

      if (session) {
        setSession(session);
        router.replace('/(tabs)');
      } else if (pendingVerification) {
        Alert.alert(
          'כמעט שם',
          'שלחנו אליך מייל לאישור החשבון. לחץ על הקישור ואז התחבר.',
          [{ text: 'אוקי', onPress: () => router.replace('/(auth)/sign-in') }],
        );
      }
    } catch (err) {
      const message = isAuthError(err)
        ? mapAuthErrorToHebrew(err.code)
        : 'שגיאת רשת. נסה שוב.';
      Alert.alert('הרשמה נכשלה', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← חזרה</Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>הרשמה</Text>
          <Text style={styles.subtitle}>הצטרף לקהילה — חינם לגמרי</Text>

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
              <Text style={styles.label}>סיסמה (לפחות 8 תווים, עם אות וספרה)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="בחר סיסמה"
                placeholderTextColor={colors.textDisabled}
                secureTextEntry
                textAlign="right"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitBtnText}>הרשמה</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.
          </Text>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => router.replace('/(auth)/sign-in')}
            disabled={loading}
          >
            <Text style={styles.switchModeText}>יש לי כבר חשבון — כניסה</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  backBtn: { marginBottom: spacing.base },
  backText: { ...typography.body, color: colors.primary },
  logo: { width: 64, height: 64, alignSelf: 'flex-end', marginBottom: spacing.base },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'right', marginBottom: spacing['2xl'] },
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
  submitBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnText: { ...typography.button, color: colors.textInverse },
  legal: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', marginTop: spacing.xl },
  switchMode: { marginTop: spacing.md, alignItems: 'center' },
  switchModeText: { ...typography.body, color: colors.primary },
});
