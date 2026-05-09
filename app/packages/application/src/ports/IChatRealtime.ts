import type { Chat, Message, MessageStatus } from '@kc/domain';

export interface InboxStreamCallbacks {
  onChatChanged: (chat: Chat) => void;
  onUnreadTotalChanged: (total: number) => void;
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
  onError: (err: Error) => void;
}

export type Unsubscribe = () => void;

export interface IChatRealtime {
  subscribeToInbox(userId: string, cb: InboxStreamCallbacks): Unsubscribe;
  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe;
}
