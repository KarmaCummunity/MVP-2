import type { AdminFeedbackEntry } from '@kc/domain';
import type { ISurveyAdminRepository } from '../ports/ISurveyAdminRepository';

export interface ListUserFeedbackInput {
  readonly limit?: number;
  readonly offset?: number;
}

export class ListUserFeedbackUseCase {
  constructor(private readonly repo: ISurveyAdminRepository) {}

  execute(input: ListUserFeedbackInput = {}): Promise<AdminFeedbackEntry[]> {
    return this.repo.listFeedback(input.limit ?? 50, input.offset ?? 0);
  }
}
