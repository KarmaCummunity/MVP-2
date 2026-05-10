// app/packages/infrastructure-supabase/src/users/follow/followMethods.ts
// Concrete implementations of the IUserRepository follow-edge methods. Kept
// out of SupabaseUserRepository.ts to keep that file under the 200-LOC cap.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowEdge, User } from '@kc/domain';
import { mapUserRow, type UserRow } from '../mapUserRow';
import { mapFollowError } from './mapFollowError';

export async function followEdge(
  client: SupabaseClient,
  followerId: string,
  followedId: string,
): Promise<FollowEdge> {
  const { data, error } = await client
    .from('follow_edges')
    .insert({ follower_id: followerId, followed_id: followedId })
    .select('follower_id, followed_id, created_at')
    .single();
  if (error) throw mapFollowError(error);
  const row = data as { follower_id: string; followed_id: string; created_at: string };
  return {
    followerId: row.follower_id,
    followedId: row.followed_id,
    createdAt: row.created_at,
  };
}

export async function unfollowEdge(
  client: SupabaseClient,
  followerId: string,
  followedId: string,
): Promise<void> {
  const { error } = await client
    .from('follow_edges')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_id', followedId);
  if (error) throw mapFollowError(error);
}

export async function isFollowingEdge(
  client: SupabaseClient,
  followerId: string,
  followedId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('follow_edges')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followed_id', followedId)
    .maybeSingle();
  if (error) throw mapFollowError(error);
  return data !== null;
}

/**
 * Followers of `userId`. Cursor is the previous page's last user_id; the page
 * is sorted by created_at desc, but we use user_id for cursor stability — good
 * enough for a 50-row page in the MVP.
 */
export async function listFollowers(
  client: SupabaseClient,
  userId: string,
  limit: number,
  cursor?: string,
): Promise<User[]> {
  const q = client
    .from('follow_edges')
    .select('follower:follower_id(*)')
    .eq('followed_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) q.lt('follower_id', cursor);
  const { data, error } = await q;
  if (error) throw mapFollowError(error);
  return ((data ?? []) as unknown as { follower: UserRow | null }[])
    .map((r) => r.follower)
    .filter((u): u is UserRow => u !== null)
    .map(mapUserRow);
}

export async function listFollowing(
  client: SupabaseClient,
  userId: string,
  limit: number,
  cursor?: string,
): Promise<User[]> {
  const q = client
    .from('follow_edges')
    .select('followed:followed_id(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cursor) q.lt('followed_id', cursor);
  const { data, error } = await q;
  if (error) throw mapFollowError(error);
  return ((data ?? []) as unknown as { followed: UserRow | null }[])
    .map((r) => r.followed)
    .filter((u): u is UserRow => u !== null)
    .map(mapUserRow);
}
