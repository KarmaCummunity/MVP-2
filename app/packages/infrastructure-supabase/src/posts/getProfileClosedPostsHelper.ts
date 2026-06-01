// Helper for SupabasePostRepository.getProfileClosedPosts — kept in its own
// file to respect the 200-LOC cap on the repository. Mirrors the existing
// reopenPostHelper / getClosureCandidatesHelper pattern.
//
// Mapped to FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised), FR-POST-021.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Post, ProfileClosedPostsItem, ProfileClosedPostsListMode } from '@kc/domain';
import { applyPostActorIdentityProjectionBatch } from './applyPostActorIdentityProjection';
import { POST_SELECT_OWNER, mapPostWithOwnerRow, type PostWithOwnerJoinedRow } from './mapPostRow';

const HARD_MAX_LIMIT = 100;

export async function getProfileClosedPostsHelper(
  client: SupabaseClient,
  profileUserId: string,
  viewerUserId: string | null,
  limit: number,
  cursor?: string,
  listMode: ProfileClosedPostsListMode = 'standard',
): Promise<ProfileClosedPostsItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, HARD_MAX_LIMIT));

  const { data: rows, error: rpcError } = await client.rpc('profile_closed_posts', {
    p_profile_user_id: profileUserId,
    p_viewer_user_id: viewerUserId,
    p_limit: safeLimit,
    p_cursor: cursor ?? null,
    p_list_mode: listMode,
  });
  if (rpcError) throw new Error(`getProfileClosedPosts: ${rpcError.message}`);
  const rpcRows = (rows ?? []) as Array<{
    post_id: string;
    identity_role: 'publisher' | 'respondent';
    closed_at: string;
  }>;
  if (rpcRows.length === 0) return [];

  const ids = rpcRows.map((r) => r.post_id);
  const { data: postsData, error: postsError } = await client
    .from('posts')
    .select(POST_SELECT_OWNER)
    .in('post_id', ids);
  if (postsError) throw new Error(`getProfileClosedPosts hydrate: ${postsError.message}`);

  const hydrated = (postsData ?? []).map((row) =>
    mapPostWithOwnerRow(row as unknown as PostWithOwnerJoinedRow),
  );
  const projected = await applyPostActorIdentityProjectionBatch(client, hydrated, viewerUserId, {
    identityListingHostUserId: profileUserId,
  });

  const byId = new Map<string, Post>();
  for (const p of projected) {
    byId.set(p.postId, p);
  }

  const items: ProfileClosedPostsItem[] = [];
  for (const r of rpcRows) {
    const post = byId.get(r.post_id);
    if (!post) continue;
    items.push({ post, identityRole: r.identity_role, closedAt: r.closed_at });
  }
  return items;
}
