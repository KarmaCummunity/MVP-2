// SupabasePostRepository — adapter for IPostRepository.
// Mapped to SRS: FR-POST-001..004, FR-POST-008..011, FR-POST-014, FR-FEED-001..005, FR-FEED-013.
// Closure stubs (close/reopen) ship in P0.6. See PROJECT_STATUS §6 TD-13.
// docs/SSOT/SRS/02_functional_requirements/04_posts.md

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreatePostInput,
  FeedPage,
  IPostRepository,
  PostFeedFilter,
  PostWithOwner,
  UpdatePostInput,
} from '@kc/application';
import { PostError, type PostErrorCode } from '@kc/application';
import type { Post, PostStatus } from '@kc/domain';
import type { Database } from '../database.types';
import {
  POST_SELECT_BARE,
  POST_SELECT_OWNER,
  mapPostRow,
  mapPostWithOwnerRow,
  type PostJoinedRow,
  type PostWithOwnerJoinedRow,
} from './mapPostRow';
import { decodeCursor, encodeCursor } from './cursor';

const NOT_IMPL = (name: string, slice: string) =>
  new Error(`SupabasePostRepository.${name}: not_implemented (${slice})`);

const FEED_HARD_MAX = 100;

interface PostgresErrorShape {
  readonly code?: string;
  readonly message?: string;
  readonly details?: string;
}

// Postgres error codes:
//   23502 not_null_violation       → required column missing
//   23503 foreign_key_violation    → city_id not in cities (city_not_found) / other FK
//   23514 check_violation          → street_number regex / posts_type_fields_chk / other CHECK
//   42501 insufficient_privilege   → RLS policy denied
function mapInsertError(err: PostgresErrorShape): PostError {
  const pgCode = err.code ?? '';
  const detail = `${err.message ?? ''} ${err.details ?? ''}`;
  let code: PostErrorCode = 'unknown';
  if (pgCode === '23503') {
    code = detail.includes('city') ? 'city_not_found' : 'address_invalid';
  } else if (pgCode === '23514') {
    if (detail.includes('street_number')) code = 'street_number_invalid';
    else if (detail.includes('type_fields')) code = 'invalid_post_type';
    else code = 'address_invalid';
  } else if (pgCode === '23502') {
    code = 'address_required';
  } else if (pgCode === '42501') {
    code = 'forbidden';
  }
  return new PostError(code, `create.post: ${err.message ?? pgCode}`, err);
}

export class SupabasePostRepository implements IPostRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  // ── Feed ────────────────────────────────────────────────────────────────
  async getFeed(
    _viewerId: string | null,
    filter: PostFeedFilter,
    limit: number,
    cursor?: string,
  ): Promise<FeedPage> {
    const safeLimit = Math.max(1, Math.min(limit, FEED_HARD_MAX));
    const decoded = decodeCursor(cursor);

    let q = this.client.from('posts').select(POST_SELECT_OWNER);

    // RLS already hides removed_admin / expired / deleted_no_recipient from
    // non-owners. Default: open-only. closed_delivered surfaces for the
    // recipient view (FR-POST-017) and owner closed view (FR-POST-016).
    q = filter.includeClosed
      ? q.in('status', ['open', 'closed_delivered'])
      : q.eq('status', 'open');

    if (filter.type) q = q.eq('type', filter.type);
    if (filter.category) q = q.eq('category', filter.category);
    if (filter.city) q = q.eq('city', filter.city);

    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const escaped = filter.searchQuery.trim().replace(/[%_]/g, '\\$&');
      q = q.ilike('title', `%${escaped}%`);
    }

    if (decoded) q = q.lt('created_at', decoded.createdAt);

    if (filter.sortBy === 'city') {
      q = q.order('city', { ascending: true }).order('created_at', { ascending: false });
    } else {
      q = q.order('created_at', { ascending: false });
    }

    q = q.limit(safeLimit + 1);

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
    if (insertErr) throw mapInsertError(insertErr as unknown as PostgresErrorShape);
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
    const updateRow: Database['public']['Tables']['posts']['Update'] = {};
    if (patch.title !== undefined) updateRow.title = patch.title;
    if (patch.description !== undefined) updateRow.description = patch.description;
    if (patch.category !== undefined) updateRow.category = patch.category;
    if (patch.locationDisplayLevel !== undefined)
      updateRow.location_display_level = patch.locationDisplayLevel;
    if (patch.itemCondition !== undefined) updateRow.item_condition = patch.itemCondition;
    if (patch.urgency !== undefined) updateRow.urgency = patch.urgency;
    if (patch.visibility !== undefined) updateRow.visibility = patch.visibility;
    if (patch.address) {
      updateRow.city = patch.address.city;
      updateRow.street = patch.address.street;
      updateRow.street_number = patch.address.streetNumber;
    }

    if (Object.keys(updateRow).length === 0) {
      const current = await this.fetchPostById(postId);
      if (!current) throw new Error(`update: post ${postId} not found`);
      return current;
    }

    const { error } = await this.client.from('posts').update(updateRow).eq('post_id', postId);
    if (error) throw new Error(`update: ${error.message}`);

    const updated = await this.fetchPostById(postId);
    if (!updated) throw new Error(`update: post ${postId} not found after update`);
    return updated;
  }

  async delete(postId: string): Promise<void> {
    const { error } = await this.client.from('posts').delete().eq('post_id', postId);
    if (error) throw new Error(`delete: ${error.message}`);
  }

  // ── Closure (P0.6) ──────────────────────────────────────────────────────
  async close(_postId: string, _recipientUserId: string | null): Promise<Post> {
    throw NOT_IMPL('close', 'P0.6');
  }
  async reopen(_postId: string): Promise<Post> {
    throw NOT_IMPL('reopen', 'P0.6');
  }

  // ── User's own posts ────────────────────────────────────────────────────
  async getMyPosts(
    userId: string,
    status: PostStatus[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]> {
    if (status.length === 0) return [];
    const safeLimit = Math.max(1, Math.min(limit, FEED_HARD_MAX));
    const decoded = decodeCursor(cursor);

    let q = this.client
      .from('posts')
      .select(POST_SELECT_BARE)
      .eq('owner_id', userId)
      .in('status', status)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (decoded) q = q.lt('created_at', decoded.createdAt);

    const { data, error } = await q;
    if (error) throw new Error(`getMyPosts: ${error.message}`);
    const rows = (data ?? []) as unknown as PostJoinedRow[];
    return rows.map(mapPostRow);
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
