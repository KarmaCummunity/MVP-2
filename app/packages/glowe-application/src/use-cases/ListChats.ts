import {
  attachPreviews,
  attachUnread,
  inboxRows,
  type InboxChat,
} from '../helpers/messageHelpers';
import type {
  GloweCounterpartProfileMap,
  IGloweChatGateway,
} from '../ports/IGloweChatGateway';

export type { InboxChat };

export interface ListChatsDeps {
  readonly chat: IGloweChatGateway;
}

export interface ListChatsInput {
  readonly viewerId: string;
  readonly limit?: number;
}

export interface ListChatsResult {
  readonly chats: readonly InboxChat[];
  readonly profiles: GloweCounterpartProfileMap;
}

export async function listChats(
  deps: ListChatsDeps,
  input: ListChatsInput,
): Promise<ListChatsResult> {
  const viewerId = String(input.viewerId || '');
  if (!viewerId) return { chats: [], profiles: {} };

  const rows = await deps.chat.listMyChats(input.limit);
  const baseChats = inboxRows(rows ?? [], viewerId);
  if (!baseChats.length) return { chats: [], profiles: {} };

  const chatIds = baseChats.map((chat) => chat.chatId);
  const otherIds = baseChats.map((chat) => chat.otherId);
  const [messages, counts, profiles] = await Promise.all([
    deps.chat.lastMessages(chatIds),
    deps.chat.unreadCounts(chatIds),
    deps.chat.counterpartProfiles(otherIds),
  ]);

  const withPreviews = attachPreviews(baseChats, messages ?? []);
  const chats = attachUnread(withPreviews, counts ?? []);

  return { chats, profiles: profiles ?? {} };
}
