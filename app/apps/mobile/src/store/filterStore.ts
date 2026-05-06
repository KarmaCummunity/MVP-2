import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category, PostType } from '@kc/domain';

// Mapped to: R-MVP-Privacy-8 (save last filter)

interface FilterState {
  searchQuery: string;
  type: PostType | null;
  category: Category | null;
  city: string | null;
  includeClosed: boolean;
  sortBy: 'newest' | 'city';

  setSearchQuery: (q: string) => void;
  setType: (t: PostType | null) => void;
  setCategory: (c: Category | null) => void;
  setCity: (city: string | null) => void;
  setIncludeClosed: (v: boolean) => void;
  setSortBy: (s: 'newest' | 'city') => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DEFAULT_STATE = {
  searchQuery: '',
  type: null as PostType | null,
  category: null as Category | null,
  city: null as string | null,
  includeClosed: false,
  sortBy: 'newest' as const,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setType: (type) => set({ type }),
      setCategory: (category) => set({ category }),
      setCity: (city) => set({ city }),
      setIncludeClosed: (includeClosed) => set({ includeClosed }),
      setSortBy: (sortBy) => set({ sortBy }),

      clearAll: () => set(DEFAULT_STATE),

      activeCount: () => {
        const s = get();
        let count = 0;
        if (s.searchQuery) count++;
        if (s.type) count++;
        if (s.category) count++;
        if (s.city) count++;
        if (s.includeClosed) count++;
        if (s.sortBy !== 'newest') count++;
        return count;
      },
    }),
    {
      name: 'kc-filters',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        type: state.type,
        category: state.category,
        city: state.city,
        includeClosed: state.includeClosed,
        sortBy: state.sortBy,
      }),
    }
  )
);
