// FR-AUTH-002 (web UX enhancement) — draggable bottom sheet wrapping the
// in-app Google sign-in flow. Web only: renders the Google Identity Services
// button inside the sheet, exchanges the returned id_token for a Supabase
// session via `SignInWithGoogleIdTokenUseCase`, and routes to `/(tabs)` on
// success. The picker UI itself is rendered by GIS (FedCM overlay or popup
// fallback) — Google forbids iframe-embedding `accounts.google.com`.
// docs/SSOT/spec/01_auth_and_onboarding.md
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { isAuthError } from '@kc/application';
import { mapAuthErrorToHebrew } from '../../services/authMessages';
import { renderGoogleButton, GoogleIdentityServicesUnavailable } from '../../services/googleIdentityServices';
import { getSignInWithGoogleIdTokenUseCase } from '../../services/authComposition';
import { useAuthStore } from '../../store/authStore';
import { googleAuthSheetStyles as styles } from './GoogleAuthSheet.styles';

const SHEET_HEIGHT_RATIO = 0.9;
const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_VELOCITY = 800;
const SPRING = { damping: 22, stiffness: 120 } as const;

export interface GoogleAuthSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  /** Web client ID; pass undefined when the env var is missing → shows config error. */
  readonly clientId: string | undefined;
}

export function GoogleAuthSheet({ visible, onClose, onSuccess, clientId }: GoogleAuthSheetProps) {
  const { t } = useTranslation();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const sheetHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  const translateY = useSharedValue(sheetHeight);
  const setSession = useAuthStore((s) => s.setSession);

  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderToken, setRenderToken] = useState(0);
  const buttonHostRef = useRef<View>(null);
  const cleanupGisRef = useRef<(() => void) | null>(null);

  // Drive open/close animation off the `visible` prop.
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING);
    } else {
      translateY.value = withTiming(sheetHeight, { duration: 220 });
      setError(null);
      setSigningIn(false);
    }
  }, [visible, sheetHeight, translateY]);

  const handleClose = useCallback(() => {
    if (signingIn) return;
    onClose();
  }, [onClose, signingIn]);

  // Drag-to-dismiss
  const pan = Gesture.Pan()
    .enabled(!signingIn)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      const passedDistance = e.translationY > sheetHeight * DISMISS_DISTANCE_RATIO;
      const passedVelocity = e.velocityY > DISMISS_VELOCITY;
      if (passedDistance || passedVelocity) {
        translateY.value = withTiming(sheetHeight, { duration: 200 }, () => {
          runOnJS(handleClose)();
        });
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight,
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, sheetHeight],
      [0.5, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const handleCredential = useCallback(
    async (idToken: string, rawNonce: string) => {
      setSigningIn(true);
      setError(null);
      try {
        const { session } = await getSignInWithGoogleIdTokenUseCase().execute({
          idToken,
          nonce: rawNonce,
        });
        setSession(session);
        setSigningIn(false);
        onSuccess();
      } catch (err) {
        setSigningIn(false);
        const msg = isAuthError(err)
          ? mapAuthErrorToHebrew(err.code)
          : t('auth.networkError');
        setError(msg);
      }
    },
    [onSuccess, setSession, t],
  );

  // Mount/teardown the GIS button (web only).
  useEffect(() => {
    if (!visible) return;
    if (Platform.OS !== 'web') return;

    if (!clientId) {
      setError(t('auth.googleSheetConfigError'));
      return;
    }

    let cancelled = false;
    const host = buttonHostRef.current as unknown as HTMLElement | null;
    if (!host) return;

    const width = Math.min(380, Math.max(240, screenWidth - 80));

    (async () => {
      try {
        const cleanup = await renderGoogleButton({
          host,
          clientId,
          width,
          onCredential: ({ idToken, rawNonce }) => {
            if (cancelled) return;
            void handleCredential(idToken, rawNonce);
          },
          onError: (err) => {
            if (cancelled) return;
            setError(err.message || t('auth.googleSheetSdkError'));
          },
        });
        if (cancelled) {
          cleanup();
          return;
        }
        cleanupGisRef.current = cleanup;
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof GoogleIdentityServicesUnavailable
          ? t('auth.googleSheetSdkError')
          : (err instanceof Error ? err.message : t('auth.googleSheetSdkError'));
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
      cleanupGisRef.current?.();
      cleanupGisRef.current = null;
    };
  }, [visible, clientId, screenWidth, renderToken, handleCredential, t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.fill}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel={t('auth.googleSheetDismissA11y')}
        >
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <View style={styles.content}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t('auth.googleSheetTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.googleSheetSubtitle')}</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View ref={buttonHostRef} style={styles.buttonHost} />

              {error ? (
                <Pressable
                  style={styles.retryBtn}
                  onPress={() => {
                    setError(null);
                    setRenderToken((n) => n + 1);
                  }}
                >
                  <Text style={styles.retryBtnText}>{t('auth.googleSheetRetry')}</Text>
                </Pressable>
              ) : null}
            </View>

            {signingIn ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.textPrimary} />
                <Text style={styles.loadingText}>{t('auth.googleSheetSigningIn')}</Text>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
