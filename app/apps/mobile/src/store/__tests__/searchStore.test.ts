import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { useSearchStore } from '../searchStore';

beforeEach(() => {
  useSearchStore.setState({ recentSearches: [] });
  useSearchStore.getState().clearFilters();
});

describe('useSearchStore — recentSearches', () => {
  it('addRecentSearch trims and prepends a new query', () => {
    useSearchStore.getState().addRecentSearch('  sofa  ');
    expect(useSearchStore.getState().recentSearches).toEqual(['sofa']);
  });

  it('rejects queries shorter than 2 chars after trim (no entry added)', () => {
    useSearchStore.getState().addRecentSearch('a');
    useSearchStore.getState().addRecentSearch(' ');
    useSearchStore.getState().addRecentSearch('');
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });

  it('de-dups by moving the existing entry to the front (most-recent-first)', () => {
    useSearchStore.getState().addRecentSearch('aa');
    useSearchStore.getState().addRecentSearch('bb');
    useSearchStore.getState().addRecentSearch('cc');
    useSearchStore.getState().addRecentSearch('aa'); // duplicate
    expect(useSearchStore.getState().recentSearches).toEqual(['aa', 'cc', 'bb']);
  });

  it('caps the recent list at MAX_RECENT=10 entries', () => {
    for (let i = 0; i < 15; i++) {
      useSearchStore.getState().addRecentSearch(`query-${i}`);
    }
    const list = useSearchStore.getState().recentSearches;
    expect(list).toHaveLength(10);
    // Newest first → query-14, query-13, …, query-5.
    expect(list[0]).toBe('query-14');
    expect(list[9]).toBe('query-5');
  });

  it('clearRecentSearches empties the list', () => {
    useSearchStore.getState().addRecentSearch('aa');
    useSearchStore.getState().addRecentSearch('bb');
    useSearchStore.getState().clearRecentSearches();
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });
});

describe('useSearchStore — filter setters + clearFilters', () => {
  it('setResultType / setPostType / setCategory / setDonationCategory each update only their field', () => {
    const s = useSearchStore.getState();
    s.setResultType('user');
    s.setPostType('Give');
    s.setCategory('Electronics');
    s.setDonationCategory('food');
    const out = useSearchStore.getState();
    expect(out.resultType).toBe('user');
    expect(out.postType).toBe('Give');
    expect(out.category).toBe('Electronics');
    expect(out.donationCategory).toBe('food');
  });

  it('setCity updates both id + display name in one call', () => {
    useSearchStore.getState().setCity('IL-001', 'Tel Aviv');
    expect(useSearchStore.getState().city).toBe('IL-001');
    expect(useSearchStore.getState().cityName).toBe('Tel Aviv');
  });

  it('clearFilters resets all filter dimensions but preserves recentSearches', () => {
    const s = useSearchStore.getState();
    s.addRecentSearch('sofa');
    s.setResultType('user');
    s.setCity('IL-001', 'Tel Aviv');
    s.setSortBy('newest');
    s.clearFilters();
    const out = useSearchStore.getState();
    expect(out.recentSearches).toEqual(['sofa']); // preserved
    expect(out.resultType).toBeNull();
    expect(out.sortBy).toBe('relevance');
    expect(out.city).toBeNull();
  });
});

describe('useSearchStore — activeFilterCount', () => {
  it('returns 0 on fresh state', () => {
    expect(useSearchStore.getState().activeFilterCount()).toBe(0);
  });

  it.each([
    ['resultType', (s = useSearchStore.getState()) => s.setResultType('post')],
    ['postType', (s = useSearchStore.getState()) => s.setPostType('Give')],
    ['category', (s = useSearchStore.getState()) => s.setCategory('Furniture')],
    ['donationCategory', (s = useSearchStore.getState()) => s.setDonationCategory('food')],
  ])('counts %s as 1', (_label, apply) => {
    apply();
    expect(useSearchStore.getState().activeFilterCount()).toBe(1);
  });

  it('counts city as 1 when id is non-null (cityName alone does not count)', () => {
    useSearchStore.getState().setCity('IL-001', 'Tel Aviv');
    expect(useSearchStore.getState().activeFilterCount()).toBe(1);
  });

  it('counts sortBy as 1 only when ≠ "relevance"', () => {
    useSearchStore.getState().setSortBy('relevance');
    expect(useSearchStore.getState().activeFilterCount()).toBe(0);
    useSearchStore.getState().setSortBy('newest');
    expect(useSearchStore.getState().activeFilterCount()).toBe(1);
  });

  it('counts minFollowers as 1 only when > 0', () => {
    useSearchStore.getState().setMinFollowers(0);
    expect(useSearchStore.getState().activeFilterCount()).toBe(0);
    useSearchStore.getState().setMinFollowers(null);
    expect(useSearchStore.getState().activeFilterCount()).toBe(0);
    useSearchStore.getState().setMinFollowers(5);
    expect(useSearchStore.getState().activeFilterCount()).toBe(1);
  });

  it('all 7 active dimensions stack to 7', () => {
    const s = useSearchStore.getState();
    s.setResultType('post');
    s.setPostType('Give');
    s.setCategory('Furniture');
    s.setDonationCategory('food');
    s.setCity('IL-001', 'Tel Aviv');
    s.setSortBy('newest');
    s.setMinFollowers(5);
    expect(useSearchStore.getState().activeFilterCount()).toBe(7);
  });
});
