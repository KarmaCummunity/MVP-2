/** FR-CHAT-011 AC2 — bulk mark all unread messages in chat as read. */
import type { IChatRepository } from '../ports/IChatRepository';

export class MarkChatReadUseCase {
  constructor(private readonly repo: IChatRepository) {}
  async execute(input: { chatId: string; userId: string }): Promise<void> {
    await this.repo.markRead(input.chatId, input.userId);
  }
}
