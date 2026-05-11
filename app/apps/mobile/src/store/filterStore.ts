import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Category,
  FeedSortOrder,
  FeedStatusFilter,
  ItemCondition,
  LocationFilter,
  PostType,
} from '@kc/domain';

// Mapped to: FR-FEED-004 (filter modal), FR-FEED-005 (persisted state).
// State is saved per signed-in user via AsyncStorage so reopening the app
// restores their last filter set.

interface FilterState {
  type: PostType | null;
  categories: Category[];                 // empty = no category filter
  itemConditions: ItemCondition[];        // empty = no condition filter; only meaningful for Give
  locationFilter: LocationFilter | null;  // null = no location filter
  statusFilter: FeedStatusFilter;
  sortOrder: FeedSortOrder;
  proximitySortCity: string | null;       // null = use viewer's city

  setType: (t: PostType | null) => void;
  setCategories: (c: Category[]) => void;
  setItemConditions: (i: ItemCondition[]) => void;
  setLocationFilter: (f: LocationFilter | null) => void;
  setStatusFilter: (s: FeedStatusFilter) => void;
  setSortOrder: (s: FeedSortOrder) => void;
  setProximitySortCity: (city: string | null) => void;
  clearAll: () => void;
  activeCount: () => number;
}

const DEFAULT_STATE = {
  type: null as PostType | null,
  categories: [] as Category[],
  itemConditions: [] as ItemCondition[],
  locationFilter: null as LocationFilter | null,
  statusFilter: 'open' as FeedStatusFilter,
  sortOrder: 'newest' as FeedSortOrder,
  proximitySortCity: null as string | null,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setType: (type) => set({ type }),
      setCategories: (categories) => set({ categories }),
      setItemConditions: (itemConditions) => set({ itemConditions }),
      setLocationFilter: (locationFilter) => set({ locationFilter }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setProximitySortCity: (proximitySortCity) => set({ proximitySortCity }),

      clearAll: () => set(DEFAULT_STATE),

      activeCount: () => {
        const s = get();
        let count = 0;
        if (s.type) count++;
        if (s.categories.length > 0) count++;
        if (s.itemConditions.length > 0) count++;
        if (s.locationFilter) count++;
        if (s.statusFilter !== 'open') count++;
        if (s.sortOrder !== 'newest') count++;
        if (s.proximitySortCity) count++;
        return count;
      },
    }),
    {
      name: 'kc-filters',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // Drop legacy v1 state (old field names like `searchQuery`, `city`,
      // `includeClosed`, `sortBy`). Anyone who upgrades just lands on
      // defaults.
      migrate: () => ({ ...DEFAULT_STATE }),
      partialize: (state) => ({
        type: state.type,
        categories: state.categories,
        itemConditions: state.itemConditions,
        locationFilter: state.locationFilter,
        statusFilter: state.statusFilter,
        sortOrder: state.sortOrder,
        proximitySortCity: state.proximitySortCity,
      }),
    }
  )
);
