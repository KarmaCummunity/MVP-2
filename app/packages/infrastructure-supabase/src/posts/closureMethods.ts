// Closure methods extracted from SupabasePostRepository to keep the parent
// file under the size cap. See FR-CLOSURE-001..005.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { ClosureCandidate } from '@kc/application';
import { PostError, type PostErrorCode } from '@kc/application';
import type { Post } from '@kc/domain';
import type { Database } from '../database.types';
import { mapPostRow, POST_SELECT_BARE, type PostJoinedRow } from './mapPostRow';

const CLOSURE_CODES = new Set<PostErrorCode>([
  'closure_not_owner',
  'closure_wrong_status',
  'closure_recipient_not_in_chat',
  'reopen_window_expired',
]);

export function mapClosurePgError(error: PostgrestError): PostError {
  const msg = error.message?.trim() ?? '';
  if (CLOSURE_CODES.has(msg as PostErrorCode))
    return new PostError(msg as PostErrorCode, msg, error);
  return new PostError('unknown', error.message ?? 'closure_unknown', error);
}

async function fetchPostById(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<Post | null> {
  const { data, error } = await client
    .from('posts')
    .select(POST_SELECT_BARE)
    .eq('post_id', postId)
    .maybeSingle();
  if (error) throw new Error(`fetchPostById: ${error.message}`);
  if (!data) return null;
  return mapPostRow(data as unknown as PostJoinedRow);
}

export async function closePost(
  client: SupabaseClient<Database>,
  postId: string,
  recipientUserId: string | null,
): Promise<Post> {
  if (recipientUserId !== null) {
    // Atomic RPC (0015): insert recipient + flip status; triggers cascade counters.
    const { error } = await client.rpc('close_post_with_recipient', {
      p_post_id: postId,
      p_recipient_user_id: recipientUserId,
    });
    if (error) throw mapClosurePgError(error);
    const reread = await fetchPostById(client, postId);
    if (!reread) throw new PostError('unknown', `post ${postId} disappeared after close`);
    return reread;
  }
  // Close without recipient: single-table UPDATE gated on status='open' to
  // prevent a race where a concurrent close_post_with_recipient already moved
  // the post to closed_delivered (B7). If the gate misses, no rows are
  // affected and we surface a typed error.
  const deleteAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: updated, error } = await client
    .from('posts')
    .update({ status: 'deleted_no_recipient', delete_after: deleteAfter })
    .eq('post_id', postId)
    .eq('status', 'open')
    .select('post_id');
  if (error) throw mapClosurePgError(error);
  if (!updated || updated.length === 0) {
    throw new PostError('closure_wrong_status', 'closure_wrong_status');
  }
  const reread = await fetchPostById(client, postId);
  if (!reread) throw new PostError('unknown', `post ${postId} disappeared after close`);
  return reread;
}

export async function reopenPost(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<Post> {
  const { data: current, error: readErr } = await client
    .from('posts')
    .select('status, reopen_count')
    .eq('post_id', postId)
    .single();
  if (readErr) throw mapClosurePgError(readErr);

  if (current.status === 'closed_delivered') {
    // Atomic RPC (0015): delete recipient + flip status + reopen_count++.
    const { error } = await client.rpc('reopen_post_marked', { p_post_id: postId });
    if (error) throw mapClosurePgError(error);
  } else if (current.status === 'deleted_no_recipient') {
    // Single-table UPDATE gated on status='deleted_no_recipient' to prevent a
    // race where the post moved to a different state between the SELECT and
    // the UPDATE (e.g. admin removed, or the cleanup cron hard-deleted) (B8).
    // The trigger handles items_given −1.
    const { data: updated, error } = await client
      .from('posts')
      .update({
        status: 'open',
        delete_after: null,
        reopen_count: (current.reopen_count ?? 0) + 1,
      })
      .eq('post_id', postId)
      .eq('status', 'deleted_no_recipient')
      .select('post_id');
    if (error) throw mapClosurePgError(error);
    if (!updated || updated.length === 0) {
      throw new PostError('closure_wrong_status', 'closure_wrong_status');
    }
  } else {
    throw new PostError('closure_wrong_status', 'closure_wrong_status');
  }

  const reread = await fetchPostById(client, postId);
  if (!reread) throw new PostError('unknown', `post ${postId} disappeared after reopen`);
  return reread;
}

export async function getClosureCandidates(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<ClosureCandidate[]> {
  // Read post owner first — chat sides are owner vs partner.
  const { data: ownerRow, error: ownerErr } = await client
    .from('posts')
    .select('owner_id')
    .eq('post_id', postId)
    .single();
  if (ownerErr) throw mapClosurePgError(ownerErr);
  const ownerId = ownerRow.owner_id;

  const { data: chats, error: chatErr } = await client
    .from('chats')
    .select('chat_id, participant_a, participant_b, last_message_at')
    .eq('anchor_post_id', postId);
  if (chatErr) throw mapClosurePgError(chatErr);

  // Dedupe by partner userId, keep latest last_message_at.
  const partners = new Map<string, string>();
  for (const c of chats ?? []) {
    const otherId = c.participant_a === ownerId ? c.participant_b : c.participant_a;
    if (!c.last_message_at) continue;
    const prev = partners.get(otherId);
    if (!prev || prev < c.last_message_at) partners.set(otherId, c.last_message_at);
  }
  if (partners.size === 0) return [];

  const ids = Array.from(partners.keys());
  const { data: users, error: usersErr } = await client
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
