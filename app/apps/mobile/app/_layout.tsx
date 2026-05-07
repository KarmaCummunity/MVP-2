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
import { useAuthStore } from '../src/store/authStore';

SplashScreen.preventAutoHideAsync();


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 2 },
  },
});

function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setSession } = useAuthStore();

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

  // Redirect: unauth → (auth) or (guest) only; auth → tabs (leave auth + guest groups).
  // Exception: `/auth/callback` is the OAuth landing route — must stay reachable while
  // unauthenticated long enough to exchange the OAuth code for a session.
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inGuestGroup = (segments[0] as string | undefined) === '(guest)';
    const isOAuthCallback =
      (segments[0] as string | undefined) === 'auth' && segments[1] === 'callback';
    if (!isAuthenticated && !inAuthGroup && !inGuestGroup && !isOAuthCallback) {
      router.replace('/(auth)');
    } else if (isAuthenticated && (inAuthGroup || inGuestGroup)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, segments, router]);

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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
