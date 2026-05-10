// SupabasePostRepository — adapter for IPostRepository.
// Mapped to SRS: FR-POST-001..004, FR-POST-008..011, FR-POST-014, FR-FEED-001..005, FR-FEED-013, FR-CLOSURE-001..005.

import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type {
  ClosureCandidate,
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
import { mapInsertError } from './mapInsertError';
import { decodeCursor, encodeCursor } from './cursor';

const CLOSURE_CODES = new Set<PostErrorCode>([
  'closure_not_owner',
  'closure_wrong_status',
  'closure_recipient_not_in_chat',
  'reopen_window_expired',
]);

function mapClosurePgError(error: PostgrestError): PostError {
  const msg = error.message?.trim() ?? '';
  if (CLOSURE_CODES.has(msg as PostErrorCode))
    return new PostError(msg as PostErrorCode, msg, error);
  return new PostError('unknown', error.message ?? 'closure_unknown', error);
}

const FEED_HARD_MAX = 100;

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

  // ── Closure (FR-CLOSURE-001..005) ───────────────────────────────────────
  async close(postId: string, recipientUserId: string | null): Promise<Post> {
    if (recipientUserId !== null) {
      // Atomic via RPC (0015): insert recipient + flip status. Triggers cascade
      // both items_received +1 (recipients trigger) and items_given +1 (posts trigger).
      const { data, error } = await this.client.rpc('close_post_with_recipient', {
        p_post_id: postId,
        p_recipient_user_id: recipientUserId,
      });
      if (error) throw mapClosurePgError(error);
      if (!data) throw new PostError('unknown', 'close_post_with_recipient: no row');
      // The RPC returns a posts row; we re-read with the bare select so the mapper
      // gets the same shape it gets from `findById`.
      const reread = await this.fetchPostById(postId);
      if (!reread) throw new PostError('unknown', `post ${postId} disappeared after close`);
      return reread;
    }
    // Close without recipient: status → deleted_no_recipient, delete_after = +7d.
    const deleteAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await this.client
      .from('posts')
      .update({ status: 'deleted_no_recipient', delete_after: deleteAfter })
      .eq('post_id', postId);
    if (error) throw mapClosurePgError(error);
    const reread = await this.fetchPostById(postId);
    if (!reread) throw new PostError('unknown', `post ${postId} disappeared after close`);
    return reread;
  }

  async reopen(postId: string): Promise<Post> {
    // Need to know the current status to pick the path.
    const { data: current, error: readErr } = await this.client
      .from('posts')
      .select('status, reopen_count')
      .eq('post_id', postId)
      .single();
    if (readErr) throw mapClosurePgError(readErr);

    if (current.status === 'closed_delivered') {
      // Atomic via RPC (0015): delete recipient + flip status + reopen_count++.
      const { error } = await this.client.rpc('reopen_post_marked', { p_post_id: postId });
      if (error) throw mapClosurePgError(error);
    } else if (current.status === 'deleted_no_recipient') {
      // Single-table UPDATE; trigger handles items_given −1.
      const { error } = await this.client
        .from('posts')
        .update({
          status: 'open',
          delete_after: null,
          reopen_count: (current.reopen_count ?? 0) + 1,
        })
        .eq('post_id', postId);
      if (error) throw mapClosurePgError(error);
    } else {
      throw new PostError('closure_wrong_status', 'closure_wrong_status');
    }

    const reread = await this.fetchPostById(postId);
    if (!reread) throw new PostError('unknown', `post ${postId} disappeared after reopen`);
    return reread;
  }

  async getClosureCandidates(postId: string): Promise<ClosureCandidate[]> {
    // Step 1: read post owner so we know which side of each chat is the partner.
    const { data: ownerRow, error: ownerErr } = await this.client
      .from('posts')
      .select('owner_id')
      .eq('post_id', postId)
      .single();
    if (ownerErr) throw mapClosurePgError(ownerErr);
    const ownerId = ownerRow.owner_id;

    // Step 2: chats anchored to this post.
    const { data: chats, error: chatErr } = await this.client
      .from('chats')
      .select('chat_id, participant_a, participant_b, last_message_at')
      .eq('anchor_post_id', postId);
    if (chatErr) throw mapClosurePgError(chatErr);

    // Step 3: dedupe by partner userId, keep latest last_message_at.
    const partners = new Map<string, string>(); // partnerUserId → ISO last_message_at
    for (const c of chats ?? []) {
      const otherId = c.participant_a === ownerId ? c.participant_b : c.participant_a;
      if (!c.last_message_at) continue;
      const prev = partners.get(otherId);
      if (!prev || prev < c.last_message_at) partners.set(otherId, c.last_message_at);
    }

    if (partners.size === 0) return [];

    const ids = Array.from(partners.keys());
    const { data: users, error: usersErr } = await this.client
      .from('users')
      .select('user_id, display_name, avatar_url, city_name')
      .in('user_id', ids);
    if (usersErr) throw mapClosurePgError(usersErr);

    return (users ?? [])
      .map((u) => ({
        userId: u.user_id,
        fullName: u.display_name ?? '',
        avatarUrl: u.avatar_url,
        cityName: u.city_name ?? null,
        lastMessageAt: partners.get(u.user_id) ?? '',
      }))
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
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
