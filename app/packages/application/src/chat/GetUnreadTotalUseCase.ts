/** FR-CHAT-012 — total unread count across all my chats (for top-bar badge). */
import type { IChatRepository } from '../ports/IChatRepository';

export class GetUnreadTotalUseCase {
  constructor(private readonly repo: IChatRepository) {}
  async execute(input: { userId: string }): Promise<number> {
    return this.repo.getUnreadTotal(input.userId);
  }
}
