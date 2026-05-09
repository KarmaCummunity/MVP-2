/** FR-CHAT-007 — open or resume the support thread with the Super Admin. */
import type { Chat } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';

export class GetSupportThreadUseCase {
  constructor(private readonly repo: IChatRepository) {}
  async execute(input: { userId: string }): Promise<Chat> {
    return this.repo.getOrCreateSupportThread(input.userId);
  }
}
