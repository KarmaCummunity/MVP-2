import type { AdminSurveyOverviewItem } from '@kc/domain';
import type { ISurveyAdminRepository } from '../ports/ISurveyAdminRepository';

export class GetAdminSurveyOverviewUseCase {
  constructor(private readonly repo: ISurveyAdminRepository) {}

  execute(): Promise<AdminSurveyOverviewItem[]> {
    return this.repo.listOverview();
  }
}
