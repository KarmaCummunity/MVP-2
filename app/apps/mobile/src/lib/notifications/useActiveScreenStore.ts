import { create } from 'zustand';

interface State {
  route: string | null;
  setRoute: (route: string | null) => void;
}

/** Tracks the current expo-router route so non-React code (notification handler) can read it. */
export const useActiveScreenStore = create<State>((set) => ({
  route: null,
  setRoute: (route) => set({ route }),
}));
