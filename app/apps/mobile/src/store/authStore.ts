import { create } from 'zustand';
import type { AuthSession } from '@kc/application';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True while user browses FR-AUTH-014 guest preview (cleared on sign-in). */
  isGuest: boolean;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setGuest: (isGuest: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: session !== null,
      isLoading: false,
      ...(session !== null ? { isGuest: false } : {}),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setGuest: (isGuest) => set({ isGuest }),
  signOut: () =>
    set({ session: null, isAuthenticated: false, isLoading: false, isGuest: false }),
}));
