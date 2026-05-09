// Row mappers: chats/messages DB rows → domain entities.
// Mapped to SRS: FR-CHAT-001..013 (entity contracts in domain/entities.ts).

import type { Chat, Message, MessageKind, MessageStatus } from '@kc/domain';
import type { Database } from '../database.types';

type ChatRow = Database['public']['Tables']['chats']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

export function rowToChat(r: ChatRow): Chat {
  return {
    chatId: r.chat_id,
    participantIds: [r.participant_a, r.participant_b] as [string, string],
    anchorPostId: r.anchor_post_id,
    isSupportThread: r.is_support_thread,
    // Domain allows null; DB column is non-null but treat empty as null defensively.
    lastMessageAt: r.last_message_at ?? null,
    createdAt: r.created_at,
  };
}

export function rowToMessage(r: MessageRow): Message {
  return {
    messageId: r.message_id,
    chatId: r.chat_id,
    senderId: r.sender_id,
    kind: r.kind as MessageKind,
    // Domain says string non-null; DB allows null for system messages — coalesce to ''.
    body: r.body ?? '',
    systemPayload: (r.system_payload ?? null) as Record<string, unknown> | null,
    status: r.status as MessageStatus,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
    readAt: r.read_at,
  };
}
