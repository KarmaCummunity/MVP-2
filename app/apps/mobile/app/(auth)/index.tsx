// Splash / Welcome screen
// Mapped to: SRS screen 1.1 Splash + 1.2 Auth
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';

export default function WelcomeScreen() {
  const router = useRouter();

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
          <Text style={styles.appName}>קארמה קהילה</Text>
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
            onPress={() => router.push('/(auth)/sign-in')}
          />

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
          />

          {/* Guest preview */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => router.replace('/(tabs)')}
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
}

function AuthButton({ label, emoji, style, textStyle, onPress }: Readonly<AuthButtonProps>) {
  return (
    <TouchableOpacity style={[styles.authBtn, style]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.authBtnEmoji}>{emoji}</Text>
      <Text style={[styles.authBtnText, textStyle]}>{label}</Text>
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
  googleBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  googleBtnText: { color: colors.textPrimary },
  phoneBtn: { backgroundColor: colors.primary },
  phoneBtnText: { color: colors.textInverse },
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
