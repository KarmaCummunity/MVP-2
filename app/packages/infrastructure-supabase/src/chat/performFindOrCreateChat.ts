// Extracted from SupabaseChatRepository to stay under file-size cap.
// FR-CHAT-002 — find canonical pair or fail fast if counterpart row is gone.

import type { SupabaseClient } from '@supabase/supabase-js';
import { ChatError } from '@kc/application';
import type { Chat } from '@kc/domain';
import type { Database } from '../database.types';
import { rowToChat } from './rowMappers';
import { mapChatError } from './mapChatError';

type ChatRow = Database['public']['Tables']['chats']['Row'];
/** supabase-js loses `this` on `.rpc` when extracted; original uses `.call(client, ...)`. */
type RpcWithCall = {
  call: (
    client: SupabaseClient<Database>,
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: ChatRow | ChatRow[] | null; error: unknown }>;
};

export async function performFindOrCreateChat(
  client: SupabaseClient<Database>,
  userId: string,
  otherUserId: string,
  anchorPostId?: string,
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

  const existing = await client
    .from('chats')
    .select('*')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();
  if (existing.error) throw mapChatError(existing.error);

  if (existing.data) {
    const needsReanchor =
      anchorPostId !== undefined &&
      anchorPostId !== null &&
      existing.data.anchor_post_id !== anchorPostId;

    if (!needsReanchor) return rowToChat(existing.data);

    const { data, error } = await (client.rpc as unknown as RpcWithCall).call(
      client,
      'rpc_chat_set_anchor',
      { p_chat_id: existing.data.chat_id, p_anchor_post_id: anchorPostId },
    );
    if (error) throw mapChatError(error as never);
    const row = Array.isArray(data) ? data[0] : data;
    return rowToChat(row ?? existing.data);
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
