// ─────────────────────────────────────────────
// Search store — recent searches + active filters
// Mapped to SRS: FR-FEED-017+ (universal search engine)
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Category,
  DonationCategorySlug,
  PostType,
  SearchResultType,
  SearchSortBy,
} from '@kc/domain';

const MAX_RECENT = 10;

interface SearchState {
  // Recent searches
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;

  // Active filters
  resultType: SearchResultType | null;
  postType: PostType | null;
  category: Category | null;
  donationCategory: DonationCategorySlug | null;
  city: string | null;
  cityName: string | null; // display name for the city — UI-only
  sortBy: SearchSortBy;
  minFollowers: number | null;

  setResultType: (t: SearchResultType | null) => void;
  setPostType: (t: PostType | null) => void;
  setCategory: (c: Category | null) => void;
  setDonationCategory: (c: DonationCategorySlug | null) => void;
  setCity: (id: string | null, name: string | null) => void;
  setSortBy: (s: SearchSortBy) => void;
  setMinFollowers: (n: number | null) => void;
  clearFilters: () => void;
  activeFilterCount: () => number;
}

const DEFAULT_FILTERS = {
  resultType: null as SearchResultType | null,
  postType: null as PostType | null,
  category: null as Category | null,
  donationCategory: null as DonationCategorySlug | null,
  city: null as string | null,
  cityName: null as string | null,
  sortBy: 'relevance' as SearchSortBy,
  minFollowers: null as number | null,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      ...DEFAULT_FILTERS,

      addRecentSearch: (q: string) => {
        const trimmed = q.trim();
        if (trimmed.length < 2) return;
        set((s) => {
          const filtered = s.recentSearches.filter((r) => r !== trimmed);
          return { recentSearches: [trimmed, ...filtered].slice(0, MAX_RECENT) };
        });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      setResultType: (resultType) => set({ resultType }),
      setPostType: (postType) => set({ postType }),
      setCategory: (category) => set({ category }),
      setDonationCategory: (donationCategory) => set({ donationCategory }),
      setCity: (city, cityName) => set({ city, cityName }),
      setSortBy: (sortBy) => set({ sortBy }),
      setMinFollowers: (minFollowers) => set({ minFollowers }),

      clearFilters: () => set(DEFAULT_FILTERS),

      activeFilterCount: () => {
        const s = get();
        let count = 0;
        if (s.resultType) count++;
        if (s.postType) count++;
        if (s.category) count++;
        if (s.donationCategory) count++;
        if (s.city) count++;
        if (s.sortBy !== 'relevance') count++;
        if (s.minFollowers && s.minFollowers > 0) count++;
        return count;
      },
    }),
    {
      name: 'kc-search',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        // Don't persist filters — they reset each session
      }),
    },
  ),
);
