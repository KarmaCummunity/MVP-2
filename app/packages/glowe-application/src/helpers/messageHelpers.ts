import type {
  GloweChatRow,
  GloweChatUnreadCount,
  GloweMessageRow,
} from '../ports/IGloweChatGateway';

export interface InboxChatBase {
  readonly chatId: string;
  readonly otherId: string;
  readonly lastMessageAt: string;
  readonly isSupport: boolean;
  readonly hiddenForMe: boolean;
}

export interface InboxChat extends InboxChatBase {
  readonly previewText: string;
  readonly previewAt: string;
  readonly unread: number;
}

export interface MappedMessage {
  readonly id: string;
  readonly mine: boolean;
  readonly isSystem: boolean;
  readonly text: string;
  readonly createdAt: string;
}

export interface MessageDraftValidation {
  readonly valid: boolean;
  readonly error: string;
}

type ChatRowInput = GloweChatRow | (Partial<GloweChatRow> & { chat_id?: string });
type MessageRowInput =
  | GloweMessageRow
  | (Partial<GloweMessageRow> & {
      message_id?: string;
      sender_id?: string | null;
      body?: string | null;
    });

export function mapChatRow(row: ChatRowInput | null | undefined, meId: string): InboxChatBase {
  const r = row ?? {};
  const me = String(meId || '');
  const a = r.participant_a == null ? '' : String(r.participant_a);
  const b = r.participant_b == null ? '' : String(r.participant_b);
  const otherId = a === me ? b : a;
  const hiddenAt = a === me ? r.inbox_hidden_at_a : r.inbox_hidden_at_b;

  return {
    chatId: String(r.chat_id ?? ''),
    otherId,
    lastMessageAt: r.last_message_at || '',
    isSupport: Boolean(r.is_support_thread),
    hiddenForMe: Boolean(hiddenAt),
  };
}

export function inboxRows(
  rows: readonly ChatRowInput[] | null | undefined,
  meId: string,
): readonly InboxChatBase[] {
  const seen: Record<string, boolean> = {};
  const out: InboxChatBase[] = [];

  for (const row of rows ?? []) {
    const chat = mapChatRow(row, meId);
    if (!chat.chatId || chat.hiddenForMe || chat.isSupport || !chat.otherId) continue;
    if (seen[chat.otherId]) continue;
    seen[chat.otherId] = true;
    out.push(chat);
  }

  return out;
}

export function attachPreviews(
  chats: readonly InboxChatBase[],
  messages: readonly MessageRowInput[] | null | undefined,
): readonly (InboxChatBase & { previewText: string; previewAt: string })[] {
  const previewByChat: Record<string, MessageRowInput> = {};

  for (const message of messages ?? []) {
    if (!message?.chat_id) continue;
    const key = String(message.chat_id);
    if (!previewByChat[key]) previewByChat[key] = message;
  }

  return chats.map((chat) => {
    const preview = previewByChat[String(chat.chatId)];
    return {
      ...chat,
      previewText: preview ? String(preview.body || '') : '',
      previewAt: preview ? String(preview.created_at || '') : chat.lastMessageAt,
    };
  });
}

export function attachUnread(
  chats: readonly (InboxChatBase & { previewText: string; previewAt: string })[],
  counts: readonly GloweChatUnreadCount[] | null | undefined,
): readonly InboxChat[] {
  const unreadByChat: Record<string, number> = {};

  for (const count of counts ?? []) {
    if (count?.chat_id !== undefined) {
      unreadByChat[String(count.chat_id)] = Number(count.unread_count) || 0;
    }
  }

  return chats.map((chat) => ({
    ...chat,
    unread: unreadByChat[String(chat.chatId)] || 0,
  }));
}

export function buildFirstMessage(
  kind: string,
  title: string | null | undefined,
  text: string | null | undefined,
): string {
  const prefix = kind === 'need' ? 'Re: ' : kind === 'org' ? 'To ' : 'Re: ';
  const head = String(title || '').trim();
  const body = String(text || '').trim();
  const parts: string[] = [];
  if (head) parts.push(prefix + head);
  if (body) parts.push(body);
  return parts.join('\n\n').slice(0, 2000);
}

export function mapMessageRow(
  row: MessageRowInput | null | undefined,
  meId: string,
): MappedMessage {
  const r = row ?? {};
  return {
    id: String(r.message_id ?? ''),
    mine: String(r.sender_id || '') === String(meId || ''),
    isSystem: r.kind === 'system',
    text: String(r.body || ''),
    createdAt: String(r.created_at || ''),
  };
}

export function mapMessageRows(
  rows: readonly MessageRowInput[] | null | undefined,
  meId: string,
): readonly MappedMessage[] {
  return (rows ?? []).map((row) => mapMessageRow(row, meId));
}

export function formatChatTime(value: string | null | undefined, nowMs?: number): string {
  if (!value) return '';
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return '';

  const then = new Date(ms);
  const now = new Date(typeof nowMs === 'number' ? nowMs : Date.now());
  const sameDay =
    then.getFullYear() === now.getFullYear()
    && then.getMonth() === now.getMonth()
    && then.getDate() === now.getDate();

  try {
    return sameDay
      ? then.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return then.toISOString().slice(0, 10);
  }
}

export function validateMessageDraft(text: string | null | undefined): MessageDraftValidation {
  const trimmed = String(text || '').trim();
  if (!trimmed) return { valid: false, error: 'Please write a message.' };
  if (trimmed.length > 2000) {
    return { valid: false, error: 'Messages are capped at 2000 characters.' };
  }
  return { valid: true, error: '' };
}
