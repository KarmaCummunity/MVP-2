/** FR-MOD-002 / FR-CHAT-007 AC3 — validate and submit a support issue. */
import type { Chat } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';
import { ChatError } from './errors';

export interface SubmitSupportIssueInput {
  category: string | null;
  description: string;
}

export class SubmitSupportIssueUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: SubmitSupportIssueInput): Promise<Chat> {
    const description = input.description.trim();
    if (description.length < 10) {
      throw new ChatError('description_too_short', 'description_too_short');
    }
    return this.repo.submitSupportIssue(input.category, description);
  }
}
