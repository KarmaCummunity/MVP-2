// Inbox row bump on Realtime message INSERT (FR-CHAT-012 implementation note).
import type { Message } from '@kc/domain';
import type { ChatWithPreview } from '@kc/application';
import type { ChatState } from './chatStoreTypes';

const lastAtMs = (iso: string | null | undefined) => (iso ? Date.parse(iso) : 0);

export function reduceBumpInboxForIncomingInsert(
  s: Pick<ChatState, 'inbox' | 'unreadTotal'>,
  viewerId: string,
  msg: Message,
): Partial<Pick<ChatState, 'inbox' | 'unreadTotal'>> | null {
  const inbox = s.inbox;
  if (!inbox) return null;

  const idx = inbox.findIndex((c) => c.chatId === msg.chatId);
  if (idx < 0) return null;

  const row = inbox[idx];
  if (row.lastMessage?.messageId === msg.messageId) return null;

  const fromSelf = msg.senderId === viewerId;
  const deltaUnread = fromSelf ? 0 : 1;

  const msgMs = lastAtMs(msg.createdAt);
  const rowMs = lastAtMs(row.lastMessageAt);
  const nextLastAt = msgMs >= rowMs ? msg.createdAt : row.lastMessageAt;

  const updatedRow: ChatWithPreview = {
    ...row,
    lastMessage: msg,
    lastMessageAt: nextLastAt,
    unreadCount: row.unreadCount + deltaUnread,
  };

  const nextInbox = inbox.map((c, i) => (i === idx ? updatedRow : c));
  nextInbox.sort((a, b) => lastAtMs(b.lastMessageAt) - lastAtMs(a.lastMessageAt));

  return {
    inbox: nextInbox,
    unreadTotal: Math.max(0, s.unreadTotal + deltaUnread),
  };
}
