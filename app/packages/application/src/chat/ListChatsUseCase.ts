/** FR-CHAT-001 — list my chats sorted by lastMessageAt desc. */
import type { IChatRepository, ChatWithPreview } from '../ports/IChatRepository';

export class ListChatsUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: { userId: string }): Promise<ChatWithPreview[]> {
    const chats = await this.repo.getMyChats(input.userId);
    return [...chats].sort((a, b) => {
      const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
      const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
      return tb - ta;
    });
  }
}
