// Helper for SupabasePostRepository.getProfileClosedPosts — kept in its own
// file to respect the 200-LOC cap on the repository. Mirrors the existing
// reopenPostHelper / getClosureCandidatesHelper pattern.
//
// Mapped to FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Post, ProfileClosedPostsItem } from '@kc/domain';
import { POST_SELECT_BARE, mapPostRow, type PostJoinedRow } from './mapPostRow';

const HARD_MAX_LIMIT = 100;

export async function getProfileClosedPostsHelper(
  client: SupabaseClient,
  profileUserId: string,
  viewerUserId: string | null,
  limit: number,
  cursor?: string,
): Promise<ProfileClosedPostsItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, HARD_MAX_LIMIT));

  // Step 1: RPC returns (post_id, identity_role, closed_at) ordered desc.
  const { data: rows, error: rpcError } = await client.rpc('profile_closed_posts', {
    p_profile_user_id: profileUserId,
    p_viewer_user_id: viewerUserId, // RPC accepts NULL for anon viewers.
    p_limit: safeLimit,
    p_cursor: cursor ?? null,
  });
  if (rpcError) throw new Error(`getProfileClosedPosts: ${rpcError.message}`);
  const rpcRows = (rows ?? []) as Array<{
    post_id: string;
    identity_role: 'publisher' | 'respondent';
    closed_at: string;
  }>;
  if (rpcRows.length === 0) return [];

  // Step 2: hydrate via the standard joined SELECT. RLS applies — and since
  // migration 0059 aligned `is_post_visible_to` with the RPC's filter, the
  // verdicts match. (One exception: `deleted_no_recipient` posts on the
  // publisher's own profile are visible only to the owner per the tomb-state
  // branch in `is_post_visible_to` — which matches our intent.)
  const ids = rpcRows.map((r) => r.post_id);
  const { data: postsData, error: postsError } = await client
    .from('posts')
    .select(POST_SELECT_BARE)
    .in('post_id', ids);
  if (postsError) throw new Error(`getProfileClosedPosts hydrate: ${postsError.message}`);

  const byId = new Map<string, Post>();
  for (const row of (postsData ?? []) as unknown as PostJoinedRow[]) {
    const post = mapPostRow(row);
    byId.set(post.postId, post);
  }

  // Step 3: re-assemble in RPC's order, dropping rows lost to RLS edge cases.
  const items: ProfileClosedPostsItem[] = [];
  for (const r of rpcRows) {
    const post = byId.get(r.post_id);
    if (!post) continue;
    items.push({ post, identityRole: r.identity_role });
  }
  return items;
}
