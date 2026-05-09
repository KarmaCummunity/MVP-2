/** FR-CHAT-004 AC1 + FR-CHAT-006 — locates or creates the chat. First-anchor-wins. */
import type { Chat } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';

export interface OpenOrCreateChatInput {
  viewerId: string;
  otherUserId: string;
  anchorPostId?: string;
}

export class OpenOrCreateChatUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: OpenOrCreateChatInput): Promise<Chat> {
    return this.repo.findOrCreateChat(
      input.viewerId,
      input.otherUserId,
      input.anchorPostId,
    );
  }
}
