import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, I18nManager, Image, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@kc/ui';
import {
  getRestoreSessionUseCase,
  subscribeToSession,
} from '../src/services/authComposition';
import { getOnboardingState } from '../src/services/userComposition';
import { useAuthStore } from '../src/store/authStore';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 2 },
  },
});

function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const segments = useSegments();
  const {
    session,
    isAuthenticated,
    isLoading,
    onboardingState,
    setSession,
    setOnboardingState,
  } = useAuthStore();

  // FR-AUTH-013: cold-start session restore.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { session } = await getRestoreSessionUseCase().execute();
        if (mounted) setSession(session);
      } catch {
        if (mounted) setSession(null);
      }
    })();

    const unsubscribe = subscribeToSession((session) => {
      if (mounted) setSession(session);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setSession]);

  // Hide native splash once auth state is known.
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // FR-AUTH-007 AC2: read users.onboarding_state once we know the user.
  useEffect(() => {
    if (!isAuthenticated || !session) return;
    let cancelled = false;
    (async () => {
      try {
        const state = await getOnboardingState(session.userId);
        if (!cancelled) setOnboardingState(state);
      } catch {
        // Network/permission failure: assume completed to avoid trapping a real
        // user in an onboarding loop. Re-queried next session start.
        if (!cancelled) setOnboardingState('completed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session, setOnboardingState]);

  // Redirect rules:
  //   - Unauth + outside (auth)/(guest)/auth/callback → (auth).
  //   - Auth + just landed in (auth) or (guest) → onboarding step matching
  //     onboarding_state, or (tabs) when completed.
  //   - Auth + already past the gates (in (tabs) / (onboarding) / detail
  //     screens) → no auto-redirect. FR-AUTH-015 soft-gate (slice C) is what
  //     re-prompts pending_basic_info users on their first meaningful action;
  //     auto-redirecting from tabs back to onboarding would create a loop
  //     after FR-AUTH-010 AC3's Skip flow.
  // Exception: `/auth/callback` is the OAuth landing route — must stay reachable
  // while unauthenticated long enough to exchange the OAuth code for a session.
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inGuestGroup = (segments[0] as string | undefined) === '(guest)';
    const isOAuthCallback =
      (segments[0] as string | undefined) === 'auth' && segments[1] === 'callback';

    if (!isAuthenticated) {
      if (!inAuthGroup && !inGuestGroup && !isOAuthCallback) {
        router.replace('/(auth)');
      }
      return;
    }

    // Authenticated. Only redirect from the auth/guest groups; otherwise let
    // the user stay where they are. Hold off until onboarding state is loaded
    // so we don't briefly send them to (tabs) and then bounce to onboarding.
    if (!inAuthGroup && !inGuestGroup) return;
    if (onboardingState === null) return;

    if (onboardingState === 'pending_basic_info') {
      router.replace('/(onboarding)/basic-info');
    } else if (onboardingState === 'pending_avatar') {
      router.replace('/(onboarding)/photo');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, onboardingState, segments, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Image
          source={require('../assets/logo.png')}
          style={{ width: 96, height: 96 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      // On Android, RTL only takes effect after the JS engine restarts.
      // DevSettings.reload() triggers a fast-refresh so the RTL setting applies.
      if (Platform.OS === 'android') {
        const { DevSettings } = require('react-native') as typeof import('react-native');
        DevSettings?.reload?.();
      }
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: Platform.OS === 'ios' ? 'default' : 'fade',
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(guest)" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
              <Stack.Screen
                name="post/[id]"
                options={{
                  headerShown: true,
                  headerTitle: 'פרטי פוסט',
                  headerBackTitle: 'חזרה',
                  headerTintColor: colors.primary,
                  headerStyle: { backgroundColor: colors.surface },
                }}
              />
              <Stack.Screen
                name="user/[handle]"
                options={{
                  headerShown: true,
                  headerTitle: 'פרופיל',
                  headerBackTitle: 'חזרה',
                  headerTintColor: colors.primary,
                  headerStyle: { backgroundColor: colors.surface },
                }}
              />
              <Stack.Screen
                name="chat/[id]"
                options={{
                  headerShown: true,
                  headerBackTitle: 'חזרה',
                  headerTintColor: colors.primary,
                  headerStyle: { backgroundColor: colors.surface },
                }}
              />
            </Stack>
          </AuthGate>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
