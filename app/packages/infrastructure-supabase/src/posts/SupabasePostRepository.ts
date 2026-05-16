// SupabasePostRepository — adapter for IPostRepository.
// Mapped to SRS: FR-POST-001..004, FR-POST-008..011, FR-POST-014, FR-FEED-001..005, FR-FEED-013, FR-CLOSURE-001..005.

import type { SupabaseClient } from '@supabase/supabase-js';
import { PostError } from '@kc/application';
import type {
  ClosureCandidate,
  CreatePostInput,
  FeedPage,
  IPostRepository,
  PostFeedFilter,
  PostWithOwner,
  UpdatePostInput,
} from '@kc/application';
import type { Post, PostStatus, ProfileClosedPostsItem } from '@kc/domain';
import type { Database } from '../database.types';
import {
  POST_SELECT_BARE,
  POST_SELECT_OWNER,
  mapPostRow,
  mapPostWithOwnerRow,
  type PostJoinedRow,
  type PostWithOwnerJoinedRow,
} from './mapPostRow';
import { mapInsertError } from './mapInsertError';
import { decodeCursor, encodeCursor } from './cursor';
import { buildFeedQuery } from './feedQuery';
import { fetchRankedFeedPage, needsRankedPath } from './feedQueryRanked';
import {
  closePost as closePostHelper,
  reopenPost as reopenPostHelper,
  getClosureCandidates as getClosureCandidatesHelper,
} from './closureMethods';
import { executePostUpdate } from './executePostUpdate';
import { getProfileClosedPostsHelper } from './getProfileClosedPostsHelper';

const FEED_HARD_MAX = 100;

export class SupabasePostRepository implements IPostRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // ── Feed ────────────────────────────────────────────────────────────────
  // Two paths:
  //   - Ranked (distance sort OR radius filter): server RPC `feed_ranked_ids`
  //     returns ordered post_ids + distance_km; adapter fetches full rows by
  //     IN(...) and preserves order.
  //   - Simple (newest/oldest, equality filters only): PostgREST select-builder
  //     with a single-field createdAt cursor.
  async getFeed(
    viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage> {
    const safeLimit = Math.max(1, Math.min(limit, FEED_HARD_MAX));

    if (needsRankedPath(filter)) {
      return fetchRankedFeedPage(this.client, viewerId, filter, cursor, safeLimit);
    }

    const q = buildFeedQuery(this.client, filter, cursor, safeLimit);
    const { data, error } = await q;
    if (error) throw new Error(`getFeed: ${error.message}`);

    const rows = (data ?? []) as unknown as PostWithOwnerJoinedRow[];
    const hasMore = rows.length > safeLimit;
    const page = hasMore ? rows.slice(0, safeLimit) : rows;
    const posts = page.map(mapPostWithOwnerRow);
    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ createdAt: last.createdAt }) : null;
    return { posts, nextCursor };
  }

  // ── Single post ─────────────────────────────────────────────────────────
  async findById(postId: string, _viewerId: string | null): Promise<PostWithOwner | null> {
    const { data, error } = await this.client
      .from('posts')
      .select(POST_SELECT_OWNER)
      .eq('post_id', postId)
      .maybeSingle();
    if (error) throw new Error(`findById: ${error.message}`);
    if (!data) return null;
    return mapPostWithOwnerRow(data as unknown as PostWithOwnerJoinedRow);
  }

  // ── Mutations ───────────────────────────────────────────────────────────
  async create(input: CreatePostInput): Promise<Post> {
    const { data: insertedPost, error: insertErr } = await this.client
      .from('posts')
      .insert({
        owner_id: input.ownerId,
        type: input.type,
        visibility: input.visibility,
        title: input.title,
        description: input.description,
        category: input.category,
        city: input.address.city,
        street: input.address.street,
        street_number: input.address.streetNumber,
        location_display_level: input.locationDisplayLevel,
        item_condition: input.itemCondition,
        urgency: input.urgency,
      })
      .select('post_id')
      .single();
    if (insertErr) throw mapInsertError(insertErr);
    if (!insertedPost) throw new Error('create.post: no row returned');

    const postId = insertedPost.post_id;

    if (input.mediaAssets.length > 0) {
      const mediaRows = input.mediaAssets.map((m, i) => ({
        post_id: postId,
        ordinal: i,
        path: m.path,
        mime_type: m.mimeType,
        size_bytes: m.sizeBytes,
      }));
      const { error: mediaErr } = await this.client.from('media_assets').insert(mediaRows);
      if (mediaErr) {
        // Best-effort orphan cleanup. If this also fails the post row remains;
        // recovery is by the user editing or deleting it.
        await this.client.from('posts').delete().eq('post_id', postId);
        throw new Error(`create.media: ${mediaErr.message}`);
      }
    }

    const created = await this.fetchPostById(postId);
    if (!created) throw new Error(`create: post ${postId} disappeared after insert`);
    return created;
  }

  async update(postId: string, patch: UpdatePostInput): Promise<Post> {
    return executePostUpdate(this.client, postId, patch, (pid) => this.fetchPostById(pid));
  }

  async delete(postId: string): Promise<void> {
    const { data, error } = await this.client
      .from('posts')
      .delete()
      .eq('post_id', postId)
      .select('post_id');
    if (error) throw new Error(`delete: ${error.message}`);
    // RLS allows DELETE only for owner + open (posts_delete_self_open). No row
    // matched → PostgREST returns 200 with an empty array — treat as failure.
    if (!data?.length) {
      throw new PostError(
        'post_owner_delete_forbidden',
        'delete: no row deleted (forbidden status, recipient linked, or not owner)',
      );
    }
  }

  async adminRemove(postId: string): Promise<void> {
    const { error } = await this.client.rpc('admin_remove_post', { p_post_id: postId });
    if (error) {
      // Postgres errcode 42501 (insufficient_privilege) → forbidden.
      // PostgREST surfaces this as `code: '42501'` on the returned error.
      if (error.code === '42501' || /forbidden/i.test(error.message)) {
        throw new PostError('forbidden', error.message);
      }
      throw new Error(`adminRemove: ${error.message}`);
    }
  }

  // ── Closure (FR-CLOSURE-001..005) — delegated to closureMethods ─────────
  close(postId: string, recipientUserId: string | null): Promise<Post> {
    return closePostHelper(this.client, postId, recipientUserId);
  }
  reopen(postId: string): Promise<Post> {
    return reopenPostHelper(this.client, postId);
  }
  async unmrkRecipientSelf(postId: string): Promise<void> {
    const { error } = await this.client.rpc('rpc_recipient_unmark_self', { p_post_id: postId });
    if (error) throw new Error(`unmrkRecipientSelf: ${error.message}`);
  }
  getClosureCandidates(postId: string): Promise<ClosureCandidate[]> {
    return getClosureCandidatesHelper(this.client, postId);
  }

  // ── User's own posts ────────────────────────────────────────────────────
  // Audit §3.10 — return `{ posts, nextCursor }` so a power user with > 30
  // posts on profile isn't silently truncated. Fetches `safeLimit + 1` rows
  // to detect whether more pages exist; `nextCursor` encodes the last visible
  // row's `created_at` for `<` comparison on the next call.
  async getMyPosts(
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor: string | null }> {
    if (status.length === 0) return { posts: [], nextCursor: null };
    const safeLimit = Math.max(1, Math.min(limit, FEED_HARD_MAX));
    const decoded = decodeCursor(cursor);

    let q = this.client
      .from('posts')
      .select(POST_SELECT_BARE)
      .eq('owner_id', userId)
      .in('status', status)
      .order('created_at', { ascending: false })
      .limit(safeLimit + 1);

    if (decoded) q = q.lt('created_at', decoded.createdAt);

    const { data, error } = await q;
    if (error) throw new Error(`getMyPosts: ${error.message}`);
    const rows = (data ?? []) as unknown as PostJoinedRow[];
    const hasMore = rows.length > safeLimit;
    const page = hasMore ? rows.slice(0, safeLimit) : rows;
    const posts = page.map(mapPostRow);
    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last ? encodeCursor({ createdAt: last.createdAt }) : null;
    return { posts, nextCursor };
  }

  // ── Profile closed posts (publisher ∪ respondent) ────────────────────────
  getProfileClosedPosts(
    profileUserId: string,
    viewerUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<ProfileClosedPostsItem[]> {
    return getProfileClosedPostsHelper(this.client, profileUserId, viewerUserId, limit, cursor);
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  async countOpenByUser(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('posts')
      .select('post_id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('status', 'open');
    if (error) throw new Error(`countOpenByUser: ${error.message}`);
    return count ?? 0;
  }

  // ── Internal ────────────────────────────────────────────────────────────
  private async fetchPostById(postId: string): Promise<Post | null> {
    const { data, error } = await this.client
      .from('posts')
      .select(POST_SELECT_BARE)
      .eq('post_id', postId)
      .maybeSingle();
    if (error) throw new Error(`fetchPostById: ${error.message}`);
    if (!data) return null;
    return mapPostRow(data as unknown as PostJoinedRow);
  }
}
