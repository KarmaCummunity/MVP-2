// Splash + Welcome / Auth-method picker.
// Mapped to SRS: FR-AUTH-001 (splash), FR-AUTH-002 (auth entry, all methods),
// FR-AUTH-014 (guest preview entry point).
// docs/SSOT/spec/01_auth_and_onboarding.md
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { useAuthStore } from '../../src/store/authStore';
import {
  getOAuthRedirectUri,
  getSignInWithGoogleUseCase,
} from '../../src/services/authComposition';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';

export default function WelcomeScreen() {
  const router = useRouter();
  const setGuest = useAuthStore((s) => s.setGuest);
  const setSession = useAuthStore((s) => s.setSession);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isExecutingRef = React.useRef(false);

  const handleGoogle = async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setGoogleLoading(true);
    try {
      const { session } = await getSignInWithGoogleUseCase().execute({
        redirectTo: getOAuthRedirectUri(),
      });
      setSession(session);
      router.replace('/(tabs)');
    } catch (err) {
      const code = isAuthError(err) ? err.code : 'unknown';
      const message =
        isAuthError(err) && err.message === 'oauth_dismissed'
          ? null // user closed the browser — silent
          : isAuthError(err)
            ? mapAuthErrorToHebrew(code)
            : 'שגיאת רשת. נסה שוב.';
      if (message && !useAuthStore.getState().isAuthenticated) {
        Alert.alert('כניסה עם Google נכשלה', `${message} (${isAuthError(err) ? err.message : String(err)})`);
      }
    } finally {
      setGoogleLoading(false);
      isExecutingRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Logo / Brand */}
        <View style={styles.hero}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>קהילת קארמה</Text>
          <Text style={styles.tagline}>תן. קבל. חבר קהילה.</Text>
        </View>

        {/* Value props */}
        <View style={styles.valueProps}>
          {[
            { emoji: '🎁', text: 'פרסם חפצים שאינך צריך' },
            { emoji: '🔍', text: 'מצא מה שאתה מחפש' },
            { emoji: '💬', text: 'תאם מסירה ישירות' },
          ].map((item) => (
            <View key={item.text} style={styles.valuePropRow}>
              <Text style={styles.valuePropEmoji}>{item.emoji}</Text>
              <Text style={styles.valuePropText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Auth buttons */}
        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <AuthButton
              label="המשך עם Apple"
              emoji="🍎"
              style={styles.appleBtn}
              textStyle={styles.appleBtnText}
              onPress={() => router.push('/(auth)/sign-in')}
            />
          )}

          <AuthButton
            label="המשך עם Google"
            emoji="G"
            style={styles.googleBtn}
            textStyle={styles.googleBtnText}
            onPress={handleGoogle}
            loading={googleLoading}
          />
          
          {/* TODO: Add phone and email buttons */}
{/* 
          <AuthButton
            label="המשך עם מספר טלפון"
            emoji="📱"
            style={styles.phoneBtn}
            textStyle={styles.phoneBtnText}
            onPress={() => router.push('/(auth)/sign-in')}
          />

          <AuthButton
            label='המשך עם דוא"ל'
            emoji="✉️"
            style={styles.emailBtn}
            textStyle={styles.emailBtnText}
            onPress={() => router.push('/(auth)/sign-in')}
          /> */}

          {/* Guest preview */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => {
              setGuest(true);
              router.replace('/(guest)/feed' as Href);
            }}
          >
            <Text style={styles.guestBtnText}>הצץ בפיד (ללא כניסה)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface AuthButtonProps {
  label: string;
  emoji: string;
  style: object;
  textStyle: object;
  onPress: () => void;
  loading?: boolean;
}

function AuthButton({ label, emoji, style, textStyle, onPress, loading }: Readonly<AuthButtonProps>) {
  return (
    <TouchableOpacity
      style={[styles.authBtn, style, loading && styles.authBtnDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={(textStyle as { color?: string }).color ?? colors.textPrimary} />
      ) : (
        <>
          <Text style={styles.authBtnEmoji}>{emoji}</Text>
          <Text style={[styles.authBtnText, textStyle]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.base,
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  valueProps: {
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  valuePropEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  valuePropText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  buttons: {
    gap: spacing.sm,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.md,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  authBtnEmoji: {
    fontSize: 18,
    position: 'absolute',
    right: spacing.base,
  },
  authBtnText: {
    ...typography.button,
    textAlign: 'center',
  },
  appleBtn: { backgroundColor: '#000000' },
  appleBtnText: { color: '#FFFFFF' },
  googleBtn: { backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.border },
  googleBtnText: { color: colors.textPrimary },
  phoneBtn: { backgroundColor: colors.primary },
  phoneBtnText: { color: colors.textInverse },
  authBtnDisabled: { opacity: 0.7 },
  emailBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  emailBtnText: { color: colors.textPrimary },
  guestBtn: {
    marginTop: spacing.xs,
    alignItems: 'center',
    padding: spacing.sm,
  },
  guestBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legal: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
