import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchFilters } from '@kc/domain';
import { searchLinks, searchPosts, searchUsers } from '../searchQueryHelpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FakeOpts {
  data?: unknown;
  error?: { message: string } | null;
}
interface Op {
  kind: 'from' | 'select' | 'eq' | 'in' | 'is' | 'or' | 'gte' | 'order' | 'limit';
  args?: unknown[];
}

function makeFakeClient(opts: FakeOpts = {}): { client: SupabaseClient<any>; ops: Op[] } {
  const ops: Op[] = [];
  const result = () => ({ data: opts.data ?? null, error: opts.error ?? null });
  function makeChain(): any {
    return new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) =>
            Promise.resolve(result()).then(onFulfilled, onRejected);
        }
        return (...args: any[]) => {
          ops.push({ kind: prop as Op['kind'], args });
          return makeChain();
        };
      },
    });
  }
  const client = {
    from: (table: string) => {
      ops.push({ kind: 'from', args: [table] });
      return makeChain();
    },
  } as unknown as SupabaseClient<any>;
  return { client, ops };
}

const POST_ROW = {
  post_id: 'p_1', owner_id: 'u_1', type: 'Give', status: 'open', visibility: 'Public',
  title: 't', description: null, category: 'Other', city: 'IL-001', street: null,
  street_number: null, location_display_level: 'CityOnly', item_condition: 'Good',
  urgency: null, reopen_count: 0, delete_after: null,
  created_at: '2026-05-16T12:00:00.000Z', updated_at: '2026-05-16T12:00:00.000Z',
  owner: { user_id: 'u_1', display_name: 'A', share_handle: 'a', avatar_url: null, privacy_mode: 'Public' },
};

const USER_ROW = {
  user_id: 'u_1', display_name: 'Alice', share_handle: 'alice', avatar_url: null,
  biography: null, city: 'IL-001', city_name: 'Tel Aviv',
  followers_count: 10, items_given_count: 2,
};

const LINK_ROW = {
  id: 'l_1', user_id: 'u_1', display_name: 'Soup Kitchen', url: 'https://example.com',
  description: null, category_slug: 'food', hidden_at: null,
  created_at: '2026-05-16T12:00:00.000Z', updated_at: '2026-05-16T12:00:00.000Z',
};

describe('searchPosts', () => {
  it('queries posts with status=open + or(title/description/category ilike), then layers type/category/city eq', async () => {
    const { client, ops } = makeFakeClient({ data: [POST_ROW] });
    const filters: SearchFilters = { postType: 'Give', category: 'Electronics', city: 'tel-aviv' };
    await searchPosts(client, 'sofa', filters, 10);
    expect(ops.find((o) => o.kind === 'from')?.args).toEqual(['posts']);
    const eqs = ops.filter((o) => o.kind === 'eq').map((o) => o.args?.[0]);
    expect(eqs).toEqual(['status', 'type', 'category', 'city']);
    const or = ops.find((o) => o.kind === 'or');
    expect(or?.args?.[0]).toBe('title.ilike.%sofa%,description.ilike.%sofa%,category.ilike.%sofa%');
  });

  it('skips type/category/city when not set; orders by created_at desc + applies limit', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchPosts(client, 'q', {}, 25);
    expect(ops.filter((o) => o.kind === 'eq').map((o) => o.args?.[0])).toEqual(['status']);
    expect(ops.find((o) => o.kind === 'order')?.args).toEqual(['created_at', { ascending: false }]);
    expect(ops.find((o) => o.kind === 'limit')?.args).toEqual([25]);
  });

  it('escapes % and _ in the query before building the or() clause', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchPosts(client, 'a%b_c', {}, 10);
    const or = ops.find((o) => o.kind === 'or');
    expect(or?.args?.[0]).toBe('title.ilike.%a\\%b\\_c%,description.ilike.%a\\%b\\_c%,category.ilike.%a\\%b\\_c%');
  });

  it('throws with "searchPosts: <msg>" on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'rls denied' } });
    await expect(searchPosts(client, 'q', {}, 10)).rejects.toThrow('searchPosts: rls denied');
  });

  it('returns mapped PostWithOwner rows on success', async () => {
    const { client } = makeFakeClient({ data: [POST_ROW] });
    const out = await searchPosts(client, 'q', {}, 10);
    expect(out[0]?.postId).toBe('p_1');
  });

  it('returns [] when data is null', async () => {
    const { client } = makeFakeClient({ data: null });
    expect(await searchPosts(client, 'q', {}, 10)).toEqual([]);
  });
});

describe('searchUsers', () => {
  it('queries users with or(display_name/biography/share_handle ilike), then layers city + minFollowers', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchUsers(client, 'ali', { city: 'haifa', minFollowers: 5 }, null, 10);
    expect(ops.find((o) => o.kind === 'from')?.args).toEqual(['users']);
    const eqs = ops.filter((o) => o.kind === 'eq').map((o) => o.args?.[0]);
    expect(eqs).toContain('city');
    const gte = ops.find((o) => o.kind === 'gte');
    expect(gte?.args).toEqual(['followers_count', 5]);
    const or = ops.find((o) => o.kind === 'or');
    expect(or?.args?.[0]).toBe('display_name.ilike.%ali%,biography.ilike.%ali%,share_handle.ilike.%ali%');
  });

  it('orders by followers_count desc by default', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchUsers(client, 'q', {}, null, 10);
    expect(ops.find((o) => o.kind === 'order')?.args).toEqual(['followers_count', { ascending: false }]);
  });

  it('orders by created_at desc when sortBy === "newest"', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchUsers(client, 'q', { sortBy: 'newest' }, null, 10);
    expect(ops.find((o) => o.kind === 'order')?.args).toEqual(['created_at', { ascending: false }]);
  });

  it('skips minFollowers gte when value is 0 or negative', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchUsers(client, 'q', { minFollowers: 0 }, null, 10);
    expect(ops.find((o) => o.kind === 'gte')).toBeUndefined();
  });

  it('throws with "searchUsers: <msg>" on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'transport' } });
    await expect(searchUsers(client, 'q', {}, null, 10)).rejects.toThrow('searchUsers: transport');
  });

  it('returns mapped UserSearchResult rows on success', async () => {
    const { client } = makeFakeClient({ data: [USER_ROW] });
    const out = await searchUsers(client, 'q', {}, null, 10);
    expect(out[0]?.userId).toBe('u_1');
  });
});

describe('searchLinks', () => {
  it('filters hidden_at IS NULL and ors over display_name/description/url when no slug match and no donationCategory', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchLinks(client, 'help', {}, 10);
    const is = ops.find((o) => o.kind === 'is');
    expect(is?.args).toEqual(['hidden_at', null]);
    const or = ops.find((o) => o.kind === 'or');
    expect(or?.args?.[0]).toBe('display_name.ilike.%help%,description.ilike.%help%,url.ilike.%help%');
  });

  it('appends category_slug.eq.<slug> to or() when the query contains a Hebrew category label and donationCategory is not set', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchLinks(client, 'אוכל', {}, 10);
    const or = ops.find((o) => o.kind === 'or');
    expect(or?.args?.[0]).toBe(
      'display_name.ilike.%אוכל%,description.ilike.%אוכל%,url.ilike.%אוכל%,category_slug.eq.food',
    );
  });

  it('does not append category_slug.eq when donationCategory filter is set (the eq takes over)', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchLinks(client, 'אוכל', { donationCategory: 'medical' }, 10);
    const or = ops.find((o) => o.kind === 'or');
    expect(or?.args?.[0]).toBe('display_name.ilike.%אוכל%,description.ilike.%אוכל%,url.ilike.%אוכל%');
    const eq = ops.find((o) => o.kind === 'eq');
    expect(eq?.args).toEqual(['category_slug', 'medical']);
  });

  it('orders by created_at desc + applies limit', async () => {
    const { client, ops } = makeFakeClient({ data: [] });
    await searchLinks(client, 'q', {}, 7);
    expect(ops.find((o) => o.kind === 'order')?.args).toEqual(['created_at', { ascending: false }]);
    expect(ops.find((o) => o.kind === 'limit')?.args).toEqual([7]);
  });

  it('throws with "searchLinks: <msg>" on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'rls denied' } });
    await expect(searchLinks(client, 'q', {}, 10)).rejects.toThrow('searchLinks: rls denied');
  });

  it('returns mapped DonationLinkSearchResult rows on success', async () => {
    const { client } = makeFakeClient({ data: [LINK_ROW] });
    const out = await searchLinks(client, 'q', {}, 10);
    expect(out[0]?.id).toBe('l_1');
  });
});
