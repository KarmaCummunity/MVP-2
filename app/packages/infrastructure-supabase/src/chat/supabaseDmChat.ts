// DM-only Supabase helpers — keeps SupabaseChatRepository under file cap (TD-118).
import type { SupabaseClient } from '@supabase/supabase-js';
import { ChatError } from '@kc/application';
import type { Chat } from '@kc/domain';
import type { Database } from '../database.types';
import { rowToChat } from './rowMappers';
import { mapChatError } from './mapChatError';

type ChatRow = Database['public']['Tables']['chats']['Row'];

/** Support singleton index — see `chats_set_support_thread_flag` + `chats_unique_support_pair`. */
function isUniqueSupportPairViolation(err: {
  code?: string;
  message?: string;
  details?: string;
}): boolean {
  if (err.code !== '23505') return false;
  const blob = `${err.message ?? ''} ${err.details ?? ''}`;
  return blob.includes('chats_unique_support_pair');
}

async function fetchSupportThreadForOrderedPair(
  client: SupabaseClient<Database>,
  a: string,
  b: string,
): Promise<ChatRow | null> {
  const { data, error } = await client
    .from('chats')
    .select('*')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .eq('is_support_thread', true)
    .maybeSingle();
  if (error) throw mapChatError(error);
  return data;
}

async function maybeReanchorAndReturnChat(
  client: SupabaseClient<Database>,
  row: ChatRow,
  anchorPostId?: string,
): Promise<Chat> {
  const needsReanchor =
    anchorPostId !== undefined &&
    anchorPostId !== null &&
    row.anchor_post_id !== anchorPostId;

  if (!needsReanchor) return rowToChat(row);

  const { data, error } = await client.rpc('rpc_chat_set_anchor', {
    p_chat_id: row.chat_id,
    p_anchor_post_id: anchorPostId,
  });
  if (error) throw mapChatError(error);
  const out = Array.isArray(data) ? data[0] : data;
  return rowToChat((out as ChatRow | undefined) ?? row);
}

async function insertDmRowOrReuseSupportThread(
  client: SupabaseClient<Database>,
  a: string,
  b: string,
  anchorPostId?: string,
): Promise<Chat> {
  const insert = await client
    .from('chats')
    .insert({
      participant_a: a,
      participant_b: b,
      anchor_post_id: anchorPostId ?? null,
    })
    .select('*')
    .single();

  if (!insert.error) return rowToChat(insert.data);

  if (isUniqueSupportPairViolation(insert.error)) {
    const support = await fetchSupportThreadForOrderedPair(client, a, b);
    if (support) return maybeReanchorAndReturnChat(client, support, anchorPostId);
  }

  throw mapChatError(insert.error);
}

export async function findOrCreateDmChat(
  client: SupabaseClient<Database>,
  userId: string,
  otherUserId: string,
  anchorPostId?: string,
  options?: { preferNewThread?: boolean },
): Promise<Chat> {
  const { data: otherRow, error: otherErr } = await client
    .from('users')
    .select('user_id')
    .eq('user_id', otherUserId)
    .maybeSingle();
  if (otherErr) throw mapChatError(otherErr);
  if (!otherRow) {
    throw new ChatError('send_to_deleted_user', 'counterpart_not_found');
  }

  const [a, b] =
    userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  if (options?.preferNewThread) {
    return insertDmRowOrReuseSupportThread(client, a, b, anchorPostId);
  }

  const list = await client
    .from('chats')
    .select('*')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .eq('is_support_thread', false)
    .order('last_message_at', { ascending: false });
  if (list.error) throw mapChatError(list.error);

  const rows = list.data ?? [];
  const viewerIsA = userId === a;
  const visible = rows.find((r) =>
    viewerIsA ? r.inbox_hidden_at_a == null : r.inbox_hidden_at_b == null,
  );

  if (visible) {
    return maybeReanchorAndReturnChat(client, visible, anchorPostId);
  }

  return insertDmRowOrReuseSupportThread(client, a, b, anchorPostId);
}

export async function hideDmChatFromInbox(
  client: SupabaseClient<Database>,
  chatId: string,
): Promise<void> {
  const { error } = await client.rpc('rpc_chat_hide_for_viewer', {
    p_chat_id: chatId,
  });
  if (error) throw mapChatError(error);
}
