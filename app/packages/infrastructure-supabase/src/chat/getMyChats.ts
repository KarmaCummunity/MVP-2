// Conversations list with last-message preview + unread counts.
// Three queries (chats + messages + users) reconciled in TS — simpler against
// generated types than a LATERAL join, and adequate for MVP load.
// Mapped to SRS: FR-CHAT-001 (conversation list), FR-CHAT-006, FR-CHAT-016.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatWithPreview } from '@kc/application';
import type { Message } from '@kc/domain';
import type { Database } from '../database.types';
import { rowToChat, rowToMessage } from './rowMappers';
import { mapChatError } from './mapChatError';

type ChatRow = Database['public']['Tables']['chats']['Row'];

export function isVisibleInInboxForViewer(r: ChatRow, userId: string): boolean {
  if (r.participant_a === userId) return r.inbox_hidden_at_a == null;
  if (r.participant_b === userId) return r.inbox_hidden_at_b == null;
  return false;
}

export function counterpartId(r: ChatRow, userId: string): string | null {
  return r.participant_a === userId ? r.participant_b : r.participant_a;
}

/** One row per human counterpart — highest last_message_at wins (FR-CHAT-016). */
export function dedupeRowsByCounterpart(userId: string, rows: ChatRow[]): ChatRow[] {
  const best = new Map<string, ChatRow>();
  for (const r of rows) {
    const other = counterpartId(r, userId) ?? '__deleted__';
    const prev = best.get(other);
    if (!prev) {
      best.set(other, r);
      continue;
    }
    const ts = Date.parse(r.last_message_at);
    const pts = Date.parse(prev.last_message_at);
    if (ts > pts || (ts === pts && r.chat_id > prev.chat_id)) best.set(other, r);
  }
  return [...best.values()];
}

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

  const raw = (chatsRes.data ?? []) as ChatRow[];
  const visible = raw.filter((r) => isVisibleInInboxForViewer(r, userId));
  const rows = dedupeRowsByCounterpart(userId, visible);

  const chats = rows.map(rowToChat);
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

  const otherIds = chats
    .map((c) => (c.participantIds[0] === userId ? c.participantIds[1] : c.participantIds[0]))
    .filter((id): id is string => id != null);
  const usersRes = await client
    .from('users')
    .select('user_id, display_name, avatar_url, share_handle')
    .in('user_id', otherIds);
  if (usersRes.error) throw mapChatError(usersRes.error);
  const userMap = new Map<
    string,
    { displayName: string; avatarUrl: string | null; shareHandle: string | null }
  >();
  for (const u of usersRes.data ?? []) {
    userMap.set(u.user_id, {
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      shareHandle: u.share_handle,
    });
  }

  const list = chats.map((c) => {
    const otherId =
      c.participantIds[0] === userId ? c.participantIds[1] : c.participantIds[0];
    const found = otherId != null ? userMap.get(otherId) : null;
    return {
      ...c,
      otherParticipant:
        found && otherId != null
          ? {
              userId: otherId,
              displayName: found.displayName,
              avatarUrl: found.avatarUrl,
              shareHandle: found.shareHandle,
              isDeleted: false,
            }
          : {
              userId: null,
              displayName: 'משתמש שנמחק',
              avatarUrl: null,
              shareHandle: null,
              isDeleted: true,
            },
      lastMessage: lastMessageByChat.get(c.chatId) ?? null,
      unreadCount: unreadByChat[c.chatId] ?? 0,
    };
  });
  return list.sort((a, b) => {
    const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return tb - ta;
  });
}
