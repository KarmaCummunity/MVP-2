/** FR-CHAT-016 — personal inbox hide (server RPC). */
import type { IChatRepository } from '../ports/IChatRepository';

export interface HideChatFromInboxInput {
  chatId: string;
}

export class HideChatFromInboxUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: HideChatFromInboxInput): Promise<void> {
    await this.repo.hideChatFromInbox(input.chatId);
  }
}
