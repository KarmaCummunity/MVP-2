import type { Chat, Message, MessageStatus } from '@kc/domain';

export interface InboxStreamCallbacks {
  onChatChanged: (chat: Chat) => void;
  onUnreadTotalChanged: (total: number) => void;
  /** INSERT on messages — bump per-row unread before debounced total RPC. */
  onInboxMessageInsert?: (message: Message) => void;
}

/** Optional tuning for inbox realtime (FR-CHAT-012 race with mark-read). */
export interface SubscribeInboxOptions {
  /** When this value changes during `rpc_chat_unread_total`, the RPC result is dropped. */
  getSnapshotEpoch?: () => number;
}

export interface ChatStreamCallbacks {
  onMessage: (m: Message) => void;
  onMessageStatusChanged: (
    patch: {
      messageId: string;
      status: MessageStatus;
      deliveredAt: string | null;
      readAt: string | null;
    },
  ) => void;
  // Fires when the chat row itself changes (e.g. anchor_post_id flips, or
  // last_message_at advances). Optional — consumers that only care about
  // messages can omit it.
  onChatChanged?: (chat: Chat) => void;
  onError: (err: Error) => void;
}

export type Unsubscribe = () => void;

export interface IChatRealtime {
  subscribeToInbox(
    userId: string,
    cb: InboxStreamCallbacks,
    options?: SubscribeInboxOptions,
  ): Unsubscribe;
  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe;
}
