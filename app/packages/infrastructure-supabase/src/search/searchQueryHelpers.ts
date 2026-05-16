// Search-mode (text query) helpers for SupabaseSearchRepository.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DonationLinkSearchResult, SearchFilters, UserSearchResult } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import type { Database } from '../database.types';
import { POST_SELECT_OWNER, mapPostWithOwnerRow, type PostWithOwnerJoinedRow } from '../posts/mapPostRow';
import { type LinkRow, type SearchUserRow, mapUserSearchResult, mapLinkSearchResult } from './searchMappers';
import { escapeIlike, findMatchingCategorySlug } from './searchUtils';

type C = SupabaseClient<Database>;
const U = 'user_id, display_name, share_handle, avatar_url, biography, city, city_name, followers_count, items_given_count';

export async function searchPosts(c: C, query: string, f: SearchFilters, limit: number): Promise<PostWithOwner[]> {
  const esc = escapeIlike(query);
  let q = c.from('posts').select(POST_SELECT_OWNER).eq('status', 'open')
    .or(`title.ilike.%${esc}%,description.ilike.%${esc}%,category.ilike.%${esc}%`);
  if (f.postType) q = q.eq('type', f.postType);
  if (f.category) q = q.eq('category', f.category);
  if (f.city) q = q.eq('city', f.city);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`searchPosts: ${error.message}`);
  return ((data ?? []) as unknown as PostWithOwnerJoinedRow[]).map(mapPostWithOwnerRow);
}

export async function searchUsers(c: C, query: string, f: SearchFilters, _v: string | null, limit: number): Promise<UserSearchResult[]> {
  const esc = escapeIlike(query);
  let q = c.from('users').select(U)
    .or(`display_name.ilike.%${esc}%,biography.ilike.%${esc}%,share_handle.ilike.%${esc}%`);
  if (f.city) q = q.eq('city', f.city);
  if (f.minFollowers && f.minFollowers > 0) q = q.gte('followers_count', f.minFollowers);
  const order = f.sortBy === 'newest' ? 'created_at' : 'followers_count';
  const { data, error } = await q.order(order, { ascending: false }).limit(limit);
  if (error) throw new Error(`searchUsers: ${error.message}`);
  return ((data ?? []) as SearchUserRow[]).map(mapUserSearchResult);
}

export async function searchLinks(c: C, query: string, f: SearchFilters, limit: number): Promise<DonationLinkSearchResult[]> {
  const esc = escapeIlike(query);
  const slug = findMatchingCategorySlug(query.toLowerCase());
  let q = c.from('donation_links').select('*').is('hidden_at', null);
  if (slug && !f.donationCategory) {
    q = q.or(`display_name.ilike.%${esc}%,description.ilike.%${esc}%,url.ilike.%${esc}%,category_slug.eq.${slug}`);
  } else {
    q = q.or(`display_name.ilike.%${esc}%,description.ilike.%${esc}%,url.ilike.%${esc}%`);
  }
  if (f.donationCategory) q = q.eq('category_slug', f.donationCategory);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`searchLinks: ${error.message}`);
  return ((data ?? []) as unknown as LinkRow[]).map(mapLinkSearchResult);
}
