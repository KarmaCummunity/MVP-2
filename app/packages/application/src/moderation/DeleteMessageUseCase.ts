/** FR-ADMIN-005 — delete a chat message as super admin. */
import type { IModerationAdminRepository } from '../ports/IModerationAdminRepository';

export interface DeleteMessageInput {
  messageId: string;
}

export class DeleteMessageUseCase {
  constructor(private readonly repo: IModerationAdminRepository) {}

  async execute(input: DeleteMessageInput): Promise<void> {
    await this.repo.deleteMessage(input.messageId);
  }
}
