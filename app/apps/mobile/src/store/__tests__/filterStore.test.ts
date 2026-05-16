import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LocationFilter } from '@kc/domain';

// Persist middleware writes to AsyncStorage which calls `window.*` on the web
// path — undefined in vitest's node env. Replace with an in-memory adapter
// so the store stays usable without spamming "ReferenceError: window".
vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: (k: string) => Promise.resolve(store.get(k) ?? null),
      setItem: (k: string, v: string) => Promise.resolve(void store.set(k, v)),
      removeItem: (k: string) => Promise.resolve(void store.delete(k)),
    },
  };
});

import { useFilterStore } from '../filterStore';

// The store is a zustand singleton with persist middleware. We reset to the
// canonical default state before each test (using clearAll, which mirrors
// what the UI's "Reset" button does).

beforeEach(() => {
  useFilterStore.getState().clearAll();
});

const TLV_FILTER: LocationFilter = {
  centerCity: 'IL-001',
  centerCityName: 'Tel Aviv',
  radiusKm: 10,
};

describe('useFilterStore — defaults', () => {
  it('starts with all defaults (no filters active)', () => {
    const s = useFilterStore.getState();
    expect(s.type).toBeNull();
    expect(s.categories).toEqual([]);
    expect(s.itemConditions).toEqual([]);
    expect(s.locationFilter).toBeNull();
    expect(s.statusFilter).toBe('open');
    expect(s.sortOrder).toBe('newest');
    expect(s.proximitySortCity).toBeNull();
    expect(s.proximitySortCityName).toBeNull();
    expect(s.followersOnly).toBe(false);
  });

  it('activeCount() returns 0 on default state (no filters tweaked)', () => {
    expect(useFilterStore.getState().activeCount()).toBe(0);
  });
});

describe('useFilterStore — setters', () => {
  it('setType updates type field only', () => {
    useFilterStore.getState().setType('Give');
    expect(useFilterStore.getState().type).toBe('Give');
    expect(useFilterStore.getState().categories).toEqual([]); // untouched
  });

  it('setCategories replaces the array (not appends)', () => {
    useFilterStore.getState().setCategories(['Electronics']);
    useFilterStore.getState().setCategories(['Furniture', 'Books']);
    expect(useFilterStore.getState().categories).toEqual(['Furniture', 'Books']);
  });

  it('setProximitySortCity updates both id and name fields together', () => {
    useFilterStore.getState().setProximitySortCity('IL-001', 'Tel Aviv');
    expect(useFilterStore.getState().proximitySortCity).toBe('IL-001');
    expect(useFilterStore.getState().proximitySortCityName).toBe('Tel Aviv');
  });

  it('setLocationFilter accepts null to clear', () => {
    useFilterStore.getState().setLocationFilter(TLV_FILTER);
    useFilterStore.getState().setLocationFilter(null);
    expect(useFilterStore.getState().locationFilter).toBeNull();
  });

  it('setFollowersOnly toggles the FR-FEED-020 flag', () => {
    useFilterStore.getState().setFollowersOnly(true);
    expect(useFilterStore.getState().followersOnly).toBe(true);
    useFilterStore.getState().setFollowersOnly(false);
    expect(useFilterStore.getState().followersOnly).toBe(false);
  });
});

describe('useFilterStore — clearAll', () => {
  it('returns ALL fields to default after every kind of mutation', () => {
    const s = useFilterStore.getState();
    s.setType('Give');
    s.setCategories(['Electronics']);
    s.setItemConditions(['New']);
    s.setLocationFilter(TLV_FILTER);
    s.setStatusFilter('closed');
    s.setSortOrder('distance');
    s.setProximitySortCity('IL-001', 'Tel Aviv');
    s.setFollowersOnly(true);
    expect(useFilterStore.getState().activeCount()).toBe(8);

    useFilterStore.getState().clearAll();
    expect(useFilterStore.getState().activeCount()).toBe(0);
    expect(useFilterStore.getState()).toMatchObject({
      type: null,
      categories: [],
      itemConditions: [],
      locationFilter: null,
      statusFilter: 'open',
      sortOrder: 'newest',
      proximitySortCity: null,
      proximitySortCityName: null,
      followersOnly: false,
    });
  });
});

describe('useFilterStore — activeCount() per dimension', () => {
  it('counts type=non-null as 1', () => {
    useFilterStore.getState().setType('Give');
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts a non-empty categories array as 1 (single dimension, not 1-per-category)', () => {
    useFilterStore.getState().setCategories(['Electronics', 'Furniture', 'Books']);
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts a non-empty itemConditions array as 1', () => {
    useFilterStore.getState().setItemConditions(['New', 'LikeNew']);
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts a non-null locationFilter as 1', () => {
    useFilterStore.getState().setLocationFilter(TLV_FILTER);
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts statusFilter as 1 only when different from default "open"', () => {
    useFilterStore.getState().setStatusFilter('open');
    expect(useFilterStore.getState().activeCount()).toBe(0);
    useFilterStore.getState().setStatusFilter('closed');
    expect(useFilterStore.getState().activeCount()).toBe(1);
    useFilterStore.getState().setStatusFilter('all');
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts sortOrder as 1 only when different from default "newest"', () => {
    useFilterStore.getState().setSortOrder('newest');
    expect(useFilterStore.getState().activeCount()).toBe(0);
    useFilterStore.getState().setSortOrder('distance');
    expect(useFilterStore.getState().activeCount()).toBe(1);
    useFilterStore.getState().setSortOrder('oldest');
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts proximitySortCity as 1 when non-null (ignoring the display name)', () => {
    useFilterStore.getState().setProximitySortCity('IL-001', 'Tel Aviv');
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('counts followersOnly=true as 1 (FR-FEED-020)', () => {
    useFilterStore.getState().setFollowersOnly(true);
    expect(useFilterStore.getState().activeCount()).toBe(1);
  });

  it('all 8 dimensions stack additively up to 8', () => {
    const s = useFilterStore.getState();
    s.setType('Request');
    s.setCategories(['Books']);
    s.setItemConditions(['Good']);
    s.setLocationFilter(TLV_FILTER);
    s.setStatusFilter('all');
    s.setSortOrder('distance');
    s.setProximitySortCity('IL-001', 'Tel Aviv');
    s.setFollowersOnly(true);
    expect(useFilterStore.getState().activeCount()).toBe(8);
  });
});
