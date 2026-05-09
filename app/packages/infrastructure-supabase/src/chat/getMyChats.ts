// Conversations list with last-message preview + unread counts.
// Three queries (chats + messages + users) reconciled in TS — simpler against
// generated types than a LATERAL join, and adequate for MVP load.
// Mapped to SRS: FR-CHAT-001 (conversation list), FR-CHAT-006 (unread counters).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatWithPreview } from '@kc/application';
import type { Message } from '@kc/domain';
import type { Database } from '../database.types';
import { rowToChat, rowToMessage } from './rowMappers';
import { mapChatError } from './mapChatError';

export async function getMyChats(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ChatWithPreview[]> {
  const chatsRes = await client
    .from('chats')
    .select('*')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  if (chatsRes.error) throw mapChatError(chatsRes.error);
  const chats = (chatsRes.data ?? []).map(rowToChat);
  if (chats.length === 0) return [];

  const chatIds = chats.map((c) => c.chatId);

  const msgsRes = await client
    .from('messages')
    .select('*')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false });
  if (msgsRes.error) throw mapChatError(msgsRes.error);
  const lastMessageByChat = new Map<string, Message>();
  for (const m of (msgsRes.data ?? []).map(rowToMessage)) {
    if (!lastMessageByChat.has(m.chatId)) lastMessageByChat.set(m.chatId, m);
  }

  const unreadRes = await client
    .from('messages')
    .select('chat_id, status, sender_id')
    .in('chat_id', chatIds);
  if (unreadRes.error) throw mapChatError(unreadRes.error);
  const unreadByChat: Record<string, number> = {};
  for (const r of unreadRes.data ?? []) {
    if (r.status !== 'read' && r.sender_id !== userId) {
      unreadByChat[r.chat_id] = (unreadByChat[r.chat_id] ?? 0) + 1;
    }
  }

  const otherIds = chats.map((c) =>
    c.participantIds[0] === userId ? c.participantIds[1] : c.participantIds[0],
  );
  const usersRes = await client
    .from('users')
    .select('user_id, display_name, avatar_url')
    .in('user_id', otherIds);
  if (usersRes.error) throw mapChatError(usersRes.error);
  const userMap = new Map<string, { displayName: string; avatarUrl: string | null }>();
  for (const u of usersRes.data ?? []) {
    userMap.set(u.user_id, { displayName: u.display_name, avatarUrl: u.avatar_url });
  }

  return chats.map((c) => {
    const otherId =
      c.participantIds[0] === userId ? c.participantIds[1] : c.participantIds[0];
    const found = userMap.get(otherId);
    return {
      ...c,
      otherParticipant: found
        ? {
            userId: otherId,
            displayName: found.displayName,
            avatarUrl: found.avatarUrl,
            isDeleted: false,
          }
        : { userId: null, displayName: 'משתמש שנמחק', avatarUrl: null, isDeleted: true },
      lastMessage: lastMessageByChat.get(c.chatId) ?? null,
      unreadCount: unreadByChat[c.chatId] ?? 0,
    };
  });
}
