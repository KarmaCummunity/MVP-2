import type { Chat, Message } from '@kc/domain';

export interface ChatWithPreview extends Chat {
  otherParticipant: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
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
    anchorPostId?: string
  ): Promise<Chat>;
  findById(chatId: string): Promise<Chat | null>;

  // Messages
  getMessages(
    chatId: string,
    limit: number,
    cursor?: string
  ): Promise<Message[]>;

  sendMessage(
    chatId: string,
    senderId: string,
    body: string
  ): Promise<Message>;

  markRead(chatId: string, userId: string): Promise<void>;

  // Support thread
  getOrCreateSupportThread(userId: string, superAdminId: string): Promise<Chat>;
}
