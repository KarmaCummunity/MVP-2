// Search-mode (text query) helpers for SupabaseSearchRepository.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DonationLinkSearchResult, SearchFilters, UserSearchResult } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import type { Database } from '../database.types';
import { POST_SELECT_OWNER, mapPostWithOwnerRow, type PostWithOwnerJoinedRow } from '../posts/mapPostRow';
import { applyPostActorIdentityProjectionBatch } from '../posts/applyPostActorIdentityProjection';
import { type LinkRow, type SearchUserRow, mapUserSearchResult, mapLinkSearchResult } from './searchMappers';
import { toSearchBucket, type SearchBucket } from './searchBucket';
import { escapeIlike, findMatchingCategorySlug } from './searchUtils';

type C = SupabaseClient<Database>;
const U = 'user_id, display_name, share_handle, avatar_url, biography, city, city_name, followers_count, items_given_count';
const COUNT_EXACT = { count: 'exact' as const };

export async function searchPosts(
  c: C,
  query: string,
  f: SearchFilters,
  limit: number,
  viewerId?: string | null,
): Promise<SearchBucket<PostWithOwner>> {
  const esc = escapeIlike(query);
  let q = c
    .from('posts')
    .select(POST_SELECT_OWNER, COUNT_EXACT)
    .eq('status', 'open')
    .or(`title.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%`);
  if (f.postType) q = q.eq('type', f.postType);
  if (f.category) q = q.eq('category', f.category);
  if (f.city) q = q.eq('city', f.city);
  const { data, count, error } = await q.order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`searchPosts: ${error.message}`);
  const raw = ((data ?? []) as unknown as PostWithOwnerJoinedRow[]).map(mapPostWithOwnerRow);
  const items = await applyPostActorIdentityProjectionBatch(c, raw, viewerId ?? null);
  return toSearchBucket(items, count);
}

export async function searchUsers(
  c: C,
  query: string,
  f: SearchFilters,
  _v: string | null,
  limit: number,
): Promise<SearchBucket<UserSearchResult>> {
  const esc = escapeIlike(query);
  let q = c
    .from('users')
    .select(U, COUNT_EXACT)
    .or(`display_name.ilike.%${esc}%,biography.ilike.%${esc}%,share_handle.ilike.%${esc}%`);
  if (f.city) q = q.eq('city', f.city);
  if (f.minFollowers && f.minFollowers > 0) q = q.gte('followers_count', f.minFollowers);
  const order = f.sortBy === 'newest' ? 'created_at' : 'followers_count';
  const { data, count, error } = await q.order(order, { ascending: false }).limit(limit);
  if (error) throw new Error(`searchUsers: ${error.message}`);
  const items = ((data ?? []) as SearchUserRow[]).map(mapUserSearchResult);
  return toSearchBucket(items, count);
}

export async function searchLinks(
  c: C,
  query: string,
  f: SearchFilters,
  limit: number,
): Promise<SearchBucket<DonationLinkSearchResult>> {
  const esc = escapeIlike(query);
  const slug = findMatchingCategorySlug(query.toLowerCase());
  let q = c.from('donation_links').select('id, category_slug, url, display_name, description, tags', COUNT_EXACT).is('hidden_at', null);
  if (slug && !f.donationCategory) {
    q = q.or(`display_name.ilike.%${esc}%,description.ilike.%${esc}%,url.ilike.%${esc}%,category_slug.eq.${slug}`);
  } else {
    q = q.or(`display_name.ilike.%${esc}%,description.ilike.%${esc}%,url.ilike.%${esc}%`);
  }
  if (f.donationCategory) q = q.eq('category_slug', f.donationCategory);
  const { data, count, error } = await q.order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`searchLinks: ${error.message}`);
  const items = ((data ?? []) as unknown as LinkRow[]).map(mapLinkSearchResult);
  return toSearchBucket(items, count);
}
