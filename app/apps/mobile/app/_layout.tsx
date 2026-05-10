import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { I18nManager, Platform, View } from 'react-native';

// Web parity for `I18nManager.forceRTL`: native flips the layout, but on RN-Web
// nothing reaches the DOM unless we set `dir`/`lang` on the html element. We do
// this at module load (not inside an effect) so the first paint is already RTL.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
}
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

  // Global tab bar shows on detail screens (chat / post / user / settings) so
  // the user keeps a consistent bottom nav. Inside (tabs) the native expo-router
  // <Tabs> layout owns its own bar — we skip the global one to avoid doubling.
  // We deliberately do NOT gate on `onboardingState === 'completed'` because
  // AuthGate already redirects pending users to (onboarding); checking it here
  // creates a flicker window where the bar is hidden until the async DB read
  // resolves, even though we're definitely past auth.
  const head = segments[0] as string | undefined;
  const isOAuthCallback = head === 'auth' && segments[1] === 'callback';
  const showTabBar =
    !isLoading &&
    isAuthenticated &&
    head !== '(auth)' &&
    head !== '(guest)' &&
    head !== '(onboarding)' &&
    head !== '(tabs)' &&
    !isOAuthCallback;

  // RN-Web's flex layout doesn't reliably split height between a flex:1 child
  // and an intrinsic-height sibling — the inner View ends up at full height
  // and squeezes TabBar past the viewport. Positioning TabBar absolutely at
  // the bottom is robust across iOS / Android / web. The Stack content gets
  // bottom padding so the chat composer / scrollable list don't sit under it.
  const TAB_BAR_HEIGHT = 68;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: showTabBar ? TAB_BAR_HEIGHT : 0 }}>
        {children}
      </View>
      {showTabBar && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <TabBar />
        </View>
      )}
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
                    <Stack.Screen name="edit-profile" options={{ ...detailHeader, headerTitle: 'עריכת פרופיל' }} />
                    <Stack.Screen name="post/[id]" options={{ ...detailHeader, headerTitle: 'פרטי פוסט' }} />
                    <Stack.Screen name="user/[handle]" options={{ ...detailHeader, headerTitle: 'פרופיל' }} />
                    <Stack.Screen name="chat/[id]" options={detailHeader} />
                    {/* chat/index renders its own header inside the screen — disable the Stack one to avoid doubling. */}
                    <Stack.Screen name="chat/index" options={{ headerShown: false }} />
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
