import { create } from 'zustand';
import type { AuthSession } from '@kc/application';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  setSession: (session) =>
    set({ session, isAuthenticated: session !== null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () =>
    set({ session: null, isAuthenticated: false, isLoading: false }),
}));
