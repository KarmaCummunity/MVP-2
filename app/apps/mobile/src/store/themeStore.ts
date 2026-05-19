// Theme preference store (FR-SETTINGS-014). Device-level setting — survives
// sign-out by design; users typically share device preference across accounts.
// See `clearAllPersistedStores` for sign-out scoping notes (this store is
// intentionally NOT cleared there).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@kc/ui';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'kc-theme-mode',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
