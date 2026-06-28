import type { AdminSurveyResults } from '@kc/domain';
import type { ISurveyAdminRepository } from '../ports/ISurveyAdminRepository';

export class GetAdminSurveyResultsUseCase {
  constructor(private readonly repo: ISurveyAdminRepository) {}

  execute(slug: string): Promise<AdminSurveyResults> {
    return this.repo.getResults(slug);
  }
}
