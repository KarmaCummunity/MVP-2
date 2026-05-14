import '../src/i18n';
import React, { useEffect } from 'react';
import { Stack, usePathname, useSegments } from 'expo-router';
import { I18nManager, Platform, View } from 'react-native';
// Web parity for `I18nManager.forceRTL`: native flips the layout, but on RN-Web
// nothing reaches the DOM unless we set `dir`/`lang` on the html element. We do
// this at module load (not inside an effect) so the first paint is already RTL.
// Title + favicon overrides live here too: with `web.output: "single"` Expo
// builds from a default template that uses `expo.name`, so we can't use a
// `+html.tsx` (those only apply to `static` output).
// Register Service Worker so Chrome/Android installs the app as a proper PWA
// (WebAPK). With a SW present, tapping the home-screen icon activates the
// already-running instance instead of opening a new browser tab.
if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
  document.title = 'KC - קהילת קארמה';
  // Expo's prod export injects `<link rel="icon" href="/favicon.ico" />` from
  // `web.favicon`, but the dev server doesn't — inject it here so the tab icon
  // shows during local development too. No-op when the link already exists.
  if (!document.querySelector('link[rel="icon"]')) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '/favicon.ico';
    document.head.appendChild(link);
  }
  // iOS Safari (and WebKit-based mobile browsers) zoom the viewport when a
  // focused text control's font-size is under 16px. RN-Web maps TextInput to
  // <input>/<textarea>; cap only on narrow viewports so desktop web typography
  // stays unchanged. Native apps never execute this branch.
  const mwebInputFontId = 'kc-mweb-form-16px-floor';
  if (!document.getElementById(mwebInputFontId)) {
    const style = document.createElement('style');
    style.id = mwebInputFontId;
    style.textContent = `@media (max-width: 767.98px) {
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]),
  textarea,
  select {
    font-size: 16px !important;
  }
}`;
    document.head.appendChild(style);
  }
}
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@kc/ui';
import { useAuthStore } from '../src/store/authStore';
import { container } from '../src/lib/container';
import {
  useActiveScreenStore,
  installForegroundHandler,
  installBadgeAutoClear,
  useNotificationTapRouting,
  registerCurrentDeviceIfPermitted,
} from '../src/lib/notifications';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { SoftGateProvider } from '../src/components/OnboardingSoftGate';
import { AuthGate } from '../src/components/AuthGate';
import { detailStackScreenOptions } from '../src/navigation/detailStackScreenOptions';
import { DevBanner } from '../src/components/DevBanner';
import { TabBar } from '../src/components/TabBar';
import { EphemeralToast } from '../src/components/EphemeralToast';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 2 },
  },
});

function NotificationsBridge(): null {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const setRoute = useActiveScreenStore((s) => s.setRoute);

  useNotificationTapRouting();

  useEffect(() => {
    installForegroundHandler();
    installBadgeAutoClear();
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    setRoute(pathname ?? null);
  }, [pathname, setRoute]);

  useEffect(() => {
    if (!userId) return;
    registerCurrentDeviceIfPermitted(userId, { deviceRepo: container.deviceRepo }).catch(
      console.error,
    );
  }, [userId]);

  return null;
}

function ShellWithTabBar({ children }: Readonly<{ children: React.ReactNode }>) {
  const segments = useSegments() as string[];
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Global tab bar is the single bottom-bar implementation in the app — it
  // shows on every post-auth, post-onboarding screen, including (tabs). The
  // (tabs) layout suppresses its own RN BottomTabBar (tabBar={() => null}),
  // so we render exactly one bar everywhere and there is nothing to keep in
  // sync between two implementations.
  // We deliberately do NOT gate on `onboardingState === 'completed'` because
  // AuthGate already redirects pending users to (onboarding); checking it here
  // creates a flicker window where the bar is hidden until the async DB read
  // resolves, even though we're definitely past auth.
  const head = segments[0] as string | undefined;
  const isAuthLanding = head === 'auth' && (segments[1] === 'callback' || segments[1] === 'verify');
  const showTabBar =
    !isLoading &&
    isAuthenticated &&
    head !== '(auth)' &&
    head !== '(guest)' &&
    head !== '(onboarding)' &&
    !isAuthLanding;

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
      <EphemeralToast />
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
            <DevBanner />
            <NotificationsBridge />
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
                    <Stack.Screen name="auth/verify" />
                    {/* FR-MOD-010 AC4 — terminal screen for blocked accounts. */}
                    <Stack.Screen name="account-blocked" options={{ headerShown: true, headerTitle: '', headerBackVisible: false, headerStyle: { backgroundColor: colors.surface } }} />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="edit-profile" options={{ ...detailStackScreenOptions, headerTitle: 'עריכת פרופיל' }} />
                    <Stack.Screen name="post/[id]" options={{ ...detailStackScreenOptions, headerTitle: 'פרטי פוסט' }} />
                    {/* user/[handle]/* owns its own header via the nested _layout */}
                    <Stack.Screen name="user/[handle]" options={{ headerShown: false }} />
                    <Stack.Screen name="chat/[id]" options={detailStackScreenOptions} />
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
