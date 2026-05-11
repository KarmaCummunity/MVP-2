// DM-only Supabase helpers — keeps SupabaseChatRepository under file cap (TD-118).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Chat } from '@kc/domain';
import type { Database } from '../database.types';
import { rowToChat } from './rowMappers';
import { mapChatError } from './mapChatError';

export async function findOrCreateDmChat(
  client: SupabaseClient<Database>,
  userId: string,
  otherUserId: string,
  anchorPostId?: string,
  options?: { preferNewThread?: boolean },
): Promise<Chat> {
  const [a, b] =
    userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

  if (options?.preferNewThread) {
    const insertNew = await client
      .from('chats')
      .insert({
        participant_a: a,
        participant_b: b,
        anchor_post_id: anchorPostId ?? null,
      })
      .select('*')
      .single();
    if (insertNew.error) throw mapChatError(insertNew.error);
    return rowToChat(insertNew.data);
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
    const needsReanchor =
      anchorPostId !== undefined &&
      anchorPostId !== null &&
      visible.anchor_post_id !== anchorPostId;

    if (!needsReanchor) return rowToChat(visible);

    const { data, error } = await client.rpc('rpc_chat_set_anchor', {
      p_chat_id: visible.chat_id,
      p_anchor_post_id: anchorPostId,
    });
    if (error) throw mapChatError(error);
    const row = Array.isArray(data) ? data[0] : data;
    return rowToChat(row ?? visible);
  }

  const insert = await client
    .from('chats')
    .insert({
      participant_a: a,
      participant_b: b,
      anchor_post_id: anchorPostId ?? null,
    })
    .select('*')
    .single();
  if (insert.error) throw mapChatError(insert.error);
  return rowToChat(insert.data);
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
