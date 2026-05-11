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

// Mapped to: FR-FEED-004 (filter modal), FR-FEED-005 (persisted state),
// FR-FEED-020 (followers-only feed scope).
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
  proximitySortCityName: string | null;   // display name; UI-only — for re-hydrating the city picker
  followersOnly: boolean;                 // FR-FEED-020 — restrict to people I follow

  setType: (t: PostType | null) => void;
  setCategories: (c: Category[]) => void;
  setItemConditions: (i: ItemCondition[]) => void;
  setLocationFilter: (f: LocationFilter | null) => void;
  setStatusFilter: (s: FeedStatusFilter) => void;
  setSortOrder: (s: FeedSortOrder) => void;
  setProximitySortCity: (id: string | null, name: string | null) => void;
  setFollowersOnly: (v: boolean) => void;
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
  proximitySortCityName: null as string | null,
  followersOnly: false,
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
      setProximitySortCity: (id, name) =>
        set({ proximitySortCity: id, proximitySortCityName: name }),
      setFollowersOnly: (followersOnly) => set({ followersOnly }),

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
        if (s.followersOnly) count++;
        return count;
      },
    }),
    {
      name: 'kc-filters',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // Migrating from any prior version drops the persisted state — fields
      // and shapes have changed multiple times during P1.2. Users land on
      // defaults and pick their filters again.
      migrate: () => ({ ...DEFAULT_STATE }),
      partialize: (state) => ({
        type: state.type,
        categories: state.categories,
        itemConditions: state.itemConditions,
        locationFilter: state.locationFilter,
        statusFilter: state.statusFilter,
        sortOrder: state.sortOrder,
        proximitySortCity: state.proximitySortCity,
        proximitySortCityName: state.proximitySortCityName,
        followersOnly: state.followersOnly,
      }),
    }
  )
);
