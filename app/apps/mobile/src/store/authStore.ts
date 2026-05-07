import { create } from 'zustand';
import type { AuthSession } from '@kc/application';
import type { OnboardingState } from '@kc/domain';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True while user browses FR-AUTH-014 guest preview (cleared on sign-in). */
  isGuest: boolean;
  /** FR-AUTH-007 AC2: drives AuthGate routing to (onboarding) vs (tabs). */
  onboardingState: OnboardingState | null;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setGuest: (isGuest: boolean) => void;
  setOnboardingState: (state: OnboardingState | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  onboardingState: null,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: session !== null,
      isLoading: false,
      ...(session !== null ? { isGuest: false } : { onboardingState: null }),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setGuest: (isGuest) => set({ isGuest }),
  setOnboardingState: (onboardingState) => set({ onboardingState }),
  signOut: () =>
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: false,
      onboardingState: null,
    }),
}));
