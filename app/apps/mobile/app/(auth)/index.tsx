// Splash + Welcome / Auth-method picker.
// Mapped to SRS: FR-AUTH-001 (splash), FR-AUTH-002 (auth entry, all methods),
// FR-AUTH-014 (guest preview entry point).
// docs/SSOT/spec/01_auth_and_onboarding.md
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { useAuthStore } from '../../src/store/authStore';
import {
  getOAuthRedirectUri,
  getSignInWithGoogleUseCase,
} from '../../src/services/authComposition';
import { mapAuthErrorToHebrew } from '../../src/services/authMessages';
import { NotifyModal } from '../../src/components/NotifyModal';
import { welcomeScreenStyles as styles } from '../../src/components/auth/welcomeScreen.styles';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const setGuest = useAuthStore((s) => s.setGuest);
  const setSession = useAuthStore((s) => s.setSession);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

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
            : t('auth.networkError');
      if (message && !useAuthStore.getState().isAuthenticated) {
        setGoogleError(`${message} (${isAuthError(err) ? err.message : String(err)})`);
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
          <Text style={styles.appName}>{t('auth.welcomeAppName')}</Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
        </View>

        {/* Value props */}
        <View style={styles.valueProps}>
          {[
            { emoji: '🎁', text: t('auth.welcomeValueProp1') },
            { emoji: '🔍', text: t('auth.welcomeValueProp2') },
            { emoji: '💬', text: t('auth.welcomeValueProp3') },
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
              label={t('auth.continueWithApple')}
              emoji="🍎"
              style={styles.appleBtn}
              textStyle={styles.appleBtnText}
              onPress={() => router.push('/(auth)/sign-in')}
            />
          )}

          <AuthButton
            label={t('auth.continueWithGoogle')}
            emoji="G"
            style={styles.googleBtn}
            textStyle={styles.googleBtnText}
            onPress={handleGoogle}
            loading={googleLoading}
          />

          {/* Guest preview */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => {
              setGuest(true);
              router.replace('/(guest)/feed' as Href);
            }}
          >
            <Text style={styles.guestBtnText}>{t('auth.guestPreviewCta')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>{t('auth.legalConsentShort')}</Text>
      </ScrollView>
      <NotifyModal visible={googleError !== null} title={t('auth.googleSignInFailedTitle')} message={googleError ?? ''} onDismiss={() => setGoogleError(null)} />
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
