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

  // FR-CHAT-001: start inbox subscription on sign-in; tear it down on sign-out.
  // This effect mirrors the session effect above — it runs whenever `session`
  // changes so the subscription lifecycle is always in sync with auth state.
  useEffect(() => {
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
