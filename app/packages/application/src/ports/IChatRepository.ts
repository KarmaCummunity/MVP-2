import type { Chat, Message } from '@kc/domain';

export interface ChatWithPreview extends Chat {
  otherParticipant: {
    userId: string | null;            // null when counterpart hard-deleted
    displayName: string;
    avatarUrl: string | null;
    shareHandle: string | null;       // null when counterpart hard-deleted
    isDeleted: boolean;
  };
  lastMessage: Message | null;
  unreadCount: number;
}

export interface IChatRepository {
  // Conversations
  getMyChats(userId: string): Promise<ChatWithPreview[]>;
  findOrCreateChat(
    userId: string,
    otherUserId: string,
    anchorPostId?: string,
  ): Promise<Chat>;
  findById(chatId: string): Promise<Chat | null>;

  // Messages
  getMessages(
    chatId: string,
    limit: number,
    beforeCreatedAt?: string,
  ): Promise<Message[]>;

  sendMessage(
    chatId: string,
    senderId: string,
    body: string,
  ): Promise<Message>;

  markRead(chatId: string, userId: string): Promise<void>;

  // Counters / counterpart resolution
  getUnreadTotal(userId: string): Promise<number>;
  getCounterpart(
    chat: Chat,
    viewerId: string,
  ): Promise<{
    userId: string | null;
    displayName: string;
    avatarUrl: string | null;
    shareHandle: string | null;
    isDeleted: boolean;
  }>;

  // Support thread (FR-CHAT-007)
  getOrCreateSupportThread(userId: string): Promise<Chat>;
}
