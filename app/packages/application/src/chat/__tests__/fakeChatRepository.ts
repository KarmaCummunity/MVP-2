import type { Chat, Message } from '@kc/domain';
import type { IChatRepository, ChatWithPreview } from '../../ports/IChatRepository';

export class FakeChatRepository implements IChatRepository {
  chats: Chat[] = [];
  messages: Message[] = [];
  unread: Record<string, number> = {};
  sendCallCount = 0;

  async getMyChats(userId: string): Promise<ChatWithPreview[]> {
    return this.chats
      .filter((c) => c.participantIds.includes(userId))
      .map((c) => ({
        ...c,
        otherParticipant: {
          userId: 'other',
          displayName: 'other',
          avatarUrl: null,
          shareHandle: 'other',
          isDeleted: false,
        },
        lastMessage: this.messages.filter((m) => m.chatId === c.chatId).at(-1) ?? null,
        unreadCount: this.unread[c.chatId] ?? 0,
      }));
  }

  async findOrCreateChat(userId: string, otherUserId: string, anchorPostId?: string): Promise<Chat> {
    const ids = [userId, otherUserId].sort() as [string, string];
    const existing = this.chats.find(
      (c) => c.participantIds[0] === ids[0] && c.participantIds[1] === ids[1],
    );
    if (existing) return existing;
    const chat: Chat = {
      chatId: `chat-${this.chats.length + 1}`,
      participantIds: ids,
      anchorPostId: anchorPostId ?? null,
      isSupportThread: false,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.chats.push(chat);
    return chat;
  }

  async findById(chatId: string): Promise<Chat | null> {
    return this.chats.find((c) => c.chatId === chatId) ?? null;
  }

  async getMessages(chatId: string, limit: number, _beforeCreatedAt?: string): Promise<Message[]> {
    return this.messages.filter((m) => m.chatId === chatId).slice(-limit).reverse();
  }

  async sendMessage(chatId: string, senderId: string, body: string): Promise<Message> {
    this.sendCallCount += 1;
    const msg: Message = {
      messageId: `msg-${this.messages.length + 1}`,
      chatId,
      senderId,
      kind: 'user',
      body,
      systemPayload: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    };
    this.messages.push(msg);
    return msg;
  }

  async markRead(chatId: string, _userId: string): Promise<void> {
    this.unread[chatId] = 0;
  }

  async getUnreadTotal(_userId: string): Promise<number> {
    return Object.values(this.unread).reduce((a, b) => a + b, 0);
  }

  async getCounterpart(chat: Chat, viewerId: string) {
    const other = chat.participantIds[0] === viewerId ? chat.participantIds[1] : chat.participantIds[0];
    return { userId: other, displayName: 'fake', avatarUrl: null, shareHandle: 'fake', isDeleted: false };
  }

  async getOrCreateSupportThread(userId: string): Promise<Chat> {
    return this.findOrCreateChat(userId, 'super-admin');
  }
}
