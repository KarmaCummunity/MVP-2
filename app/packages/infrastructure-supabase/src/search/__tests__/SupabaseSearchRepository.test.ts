import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchFilters } from '@kc/domain';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock the underlying helpers so we can assert which path the orchestrator
// chose without standing up real Supabase queries. Each mock returns a
// stable, distinguishable list so the totalCount + result-array contents
// double as call-witness assertions.
vi.mock('../searchExploreHelpers', () => ({
  explorePosts: vi.fn(async () => [{ kind: 'explore-post' }]),
  exploreUsers: vi.fn(async () => [{ kind: 'explore-user' }, { kind: 'explore-user' }]),
  exploreLinks: vi.fn(async () => []),
}));
vi.mock('../searchQueryHelpers', () => ({
  searchPosts: vi.fn(async () => [{ kind: 'search-post' }, { kind: 'search-post' }]),
  searchUsers: vi.fn(async () => [{ kind: 'search-user' }]),
  searchLinks: vi.fn(async () => [{ kind: 'search-link' }, { kind: 'search-link' }, { kind: 'search-link' }]),
}));

import { SupabaseSearchRepository } from '../SupabaseSearchRepository';
import { explorePosts, exploreUsers, exploreLinks } from '../searchExploreHelpers';
import { searchPosts, searchUsers, searchLinks } from '../searchQueryHelpers';

const FAKE_CLIENT = {} as SupabaseClient<any>;
const LIMITS = { posts: 10, users: 10, links: 10 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SupabaseSearchRepository — explore vs search path', () => {
  it('routes empty query to the explore helpers', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    await repo.search('', {}, null, LIMITS);

    expect(explorePosts).toHaveBeenCalledTimes(1);
    expect(exploreUsers).toHaveBeenCalledTimes(1);
    expect(exploreLinks).toHaveBeenCalledTimes(1);
    expect(searchPosts).not.toHaveBeenCalled();
    expect(searchUsers).not.toHaveBeenCalled();
    expect(searchLinks).not.toHaveBeenCalled();
  });

  it('routes whitespace-only query to the explore helpers (trim check)', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    await repo.search('   \t  ', {}, null, LIMITS);

    expect(explorePosts).toHaveBeenCalledTimes(1);
    expect(searchPosts).not.toHaveBeenCalled();
  });

  it('routes a non-empty query to the search helpers', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    await repo.search('car', {}, 'u_viewer', LIMITS);

    expect(searchPosts).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchLinks).toHaveBeenCalledTimes(1);
    expect(explorePosts).not.toHaveBeenCalled();
  });

  it('forwards (client, query, filters, limit) to each search helper', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);
    const filters: SearchFilters = { category: 'Electronics' };

    await repo.search('car', filters, 'u_viewer', { posts: 5, users: 7, links: 9 });

    expect(searchPosts).toHaveBeenCalledWith(FAKE_CLIENT, 'car', filters, 5);
    expect(searchUsers).toHaveBeenCalledWith(FAKE_CLIENT, 'car', filters, 'u_viewer', 7);
    expect(searchLinks).toHaveBeenCalledWith(FAKE_CLIENT, 'car', filters, 9);
  });

  it('forwards (client, filters, limit) to each explore helper (no query arg)', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);
    const filters: SearchFilters = { city: 'tel-aviv' };

    await repo.search('', filters, 'u_viewer', { posts: 5, users: 7, links: 9 });

    expect(explorePosts).toHaveBeenCalledWith(FAKE_CLIENT, filters, 5);
    expect(exploreUsers).toHaveBeenCalledWith(FAKE_CLIENT, filters, 'u_viewer', 7);
    expect(exploreLinks).toHaveBeenCalledWith(FAKE_CLIENT, filters, 9);
  });
});

describe('SupabaseSearchRepository — resultType gating', () => {
  it('runs only posts when resultType === "post"', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    const out = await repo.search('car', { resultType: 'post' }, null, LIMITS);

    expect(searchPosts).toHaveBeenCalledTimes(1);
    expect(searchUsers).not.toHaveBeenCalled();
    expect(searchLinks).not.toHaveBeenCalled();
    expect(out.users).toEqual([]);
    expect(out.links).toEqual([]);
  });

  it('runs only users when resultType === "user"', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    const out = await repo.search('car', { resultType: 'user' }, null, LIMITS);

    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchPosts).not.toHaveBeenCalled();
    expect(searchLinks).not.toHaveBeenCalled();
    expect(out.posts).toEqual([]);
    expect(out.links).toEqual([]);
  });

  it('runs only links when resultType === "link"', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    const out = await repo.search('car', { resultType: 'link' }, null, LIMITS);

    expect(searchLinks).toHaveBeenCalledTimes(1);
    expect(searchPosts).not.toHaveBeenCalled();
    expect(searchUsers).not.toHaveBeenCalled();
    expect(out.posts).toEqual([]);
    expect(out.users).toEqual([]);
  });

  it('runs all three when resultType is null', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    await repo.search('car', { resultType: null }, null, LIMITS);

    expect(searchPosts).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchLinks).toHaveBeenCalledTimes(1);
  });

  it('runs all three when resultType is absent (treats undefined === null === all)', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    await repo.search('car', {}, null, LIMITS);

    expect(searchPosts).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchLinks).toHaveBeenCalledTimes(1);
  });
});

describe('SupabaseSearchRepository — totalCount + result fan-out', () => {
  it('computes totalCount as posts.length + users.length + links.length', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    // Mocks return 2 search-posts + 1 search-user + 3 search-links = 6.
    const out = await repo.search('car', {}, null, LIMITS);

    expect(out.totalCount).toBe(6);
    expect(out.posts).toHaveLength(2);
    expect(out.users).toHaveLength(1);
    expect(out.links).toHaveLength(3);
  });

  it('counts only the enabled bucket when resultType narrows the search', async () => {
    const repo = new SupabaseSearchRepository(FAKE_CLIENT);

    const out = await repo.search('car', { resultType: 'user' }, null, LIMITS);

    // Only the searchUsers mock fires (1 result). Other buckets are [] → 0.
    expect(out.totalCount).toBe(1);
  });
});
