// AuthGate — cold-start session restore + onboarding-state read + redirect
// rules between (auth) / (guest) / (onboarding) / (tabs).
// Mapped to SRS: FR-AUTH-007 AC2, FR-AUTH-013 (cold-start), FR-AUTH-014 (guest),
// FR-AUTH-010 AC3 (Skip preserves location).
// FR-CHAT-001: inbox subscription started on sign-in, torn down on sign-out.
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@kc/ui';
import {
  getRestoreSessionUseCase,
  subscribeToSession,
} from '../services/authComposition';
import { tryDevAutoSignIn } from '../services/devAutoSignIn';
import { getDevGhostSession, isDevGhostSessionEnabled } from '../services/devGhostSession';
import { getOnboardingState } from '../services/userComposition';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { container } from '../lib/container';

export function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
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
  // Dev-only fallbacks (compiled out of production bundles by `__DEV__`):
  //   1. Ghost session — fake JWT, instant, layout-only (devGhostSession.ts)
  //   2. Auto sign-in — real Supabase auth with test credentials (devAutoSignIn.ts)
  // Ghost takes priority because it's instant and has no network dependency.
  useEffect(() => {
    let mounted = true;

    // Ghost mode short-circuits the restore flow entirely — no Supabase call,
    // no subscription needed (the fake session never changes).
    const ghost = getDevGhostSession();
    if (ghost) {
      setSession(ghost);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const { session } = await getRestoreSessionUseCase().execute();
        const devSession = await tryDevAutoSignIn(session);
        if (mounted) setSession(devSession ?? session);
      } catch {
        const devSession = await tryDevAutoSignIn(null);
        if (mounted) setSession(devSession);
      }
    })();

    const unsubscribe = subscribeToSession((s) => {
      if (mounted) setSession(s);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setSession]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  // FR-AUTH-007 AC2: read users.onboarding_state once we know the user.
  // Ghost mode skips the Supabase read (it would 401) and assumes 'completed'
  // so AuthGate redirects straight to /(tabs).
  useEffect(() => {
    if (!isAuthenticated || !session) return;
    if (isDevGhostSessionEnabled()) {
      setOnboardingState('completed');
      return;
    }
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

  // FR-CHAT-001: start inbox subscription on sign-in; tear it down on sign-out.
  // This effect mirrors the session effect above — it runs whenever `session`
  // changes so the subscription lifecycle is always in sync with auth state.
  // Ghost mode skips realtime entirely (the fake JWT would be rejected and
  // generate noisy WS reconnect loops).
  useEffect(() => {
    if (isDevGhostSessionEnabled()) return;
    if (session?.userId) {
      useChatStore.getState().startInboxSub(session.userId, container.chatRepo, container.chatRealtime);
    } else {
      useChatStore.getState().resetOnSignOut();
    }
  }, [session]);

  // Redirect rules:
  //   - Unauth + outside (auth)/(guest)/auth/callback → (auth).
  //   - Auth + just landed in (auth) or (guest) → onboarding step matching
  //     onboarding_state, or (tabs) when completed.
  //   - Auth + already past the gates → no auto-redirect (FR-AUTH-015 soft-gate
  //     handles pending_basic_info on first meaningful action; auto-redirecting
  //     from tabs back to onboarding would loop after the FR-AUTH-010 AC3 Skip).
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
          source={require('../../assets/logo.png')}
          style={{ width: 96, height: 96 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return <>{children}</>;
}
