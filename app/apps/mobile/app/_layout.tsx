import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { I18nManager, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@kc/ui';
import { useAuthStore } from '../src/store/authStore';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { SoftGateProvider } from '../src/components/OnboardingSoftGate';
import { AuthGate } from '../src/components/AuthGate';
import { BackButton } from '../src/components/BackButton';
import { TabBar } from '../src/components/TabBar';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 2 },
  },
});

const detailHeader = {
  headerShown: true,
  headerLeft: BackButton,
  headerBackVisible: false,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
} as const;

function ShellWithTabBar({ children }: Readonly<{ children: React.ReactNode }>) {
  const segments = useSegments() as string[];
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const onboardingState = useAuthStore((s) => s.onboardingState);

  // Tab bar shows once the user is past auth + onboarding. Hidden on (auth),
  // (guest), (onboarding), and the OAuth callback route — never anywhere else,
  // so detail screens (chat, post, user, settings) keep the bar visible.
  const head = segments[0] as string | undefined;
  const isOAuthCallback = head === 'auth' && segments[1] === 'callback';
  const showTabBar =
    !isLoading &&
    isAuthenticated &&
    onboardingState === 'completed' &&
    head !== '(auth)' &&
    head !== '(guest)' &&
    head !== '(onboarding)' &&
    !isOAuthCallback;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      {showTabBar && <TabBar />}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
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
              <SoftGateProvider>
                <ShellWithTabBar>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: colors.background },
                      animation: Platform.OS === 'ios' ? 'default' : 'fade',
                    }}
                  >
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(guest)" />
                    <Stack.Screen name="(onboarding)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="auth/callback" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="post/[id]" options={{ ...detailHeader, headerTitle: 'פרטי פוסט' }} />
                    <Stack.Screen name="user/[handle]" options={{ ...detailHeader, headerTitle: 'פרופיל' }} />
                    <Stack.Screen name="chat/[id]" options={detailHeader} />
                    <Stack.Screen name="chat/index" options={{ ...detailHeader, headerTitle: 'הודעות' }} />
                  </Stack>
                </ShellWithTabBar>
              </SoftGateProvider>
            </AuthGate>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
