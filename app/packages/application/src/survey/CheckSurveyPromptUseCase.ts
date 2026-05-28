import type { SurveyPromptEligibility } from '@kc/domain';
import type { ISurveyRepository } from '../ports/ISurveyRepository';

export interface CheckSurveyPromptInput {
  readonly slug: string;
  readonly sessionCount: number;
}

export class CheckSurveyPromptUseCase {
  constructor(private readonly repo: ISurveyRepository) {}

  execute(input: CheckSurveyPromptInput): Promise<SurveyPromptEligibility> {
    return this.repo.checkPromptEligibility(input.slug, input.sessionCount);
  }
}
