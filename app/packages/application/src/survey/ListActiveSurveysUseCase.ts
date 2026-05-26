import type { SurveyListItem } from '@kc/domain';
import type { ISurveyRepository } from '../ports/ISurveyRepository';

export class ListActiveSurveysUseCase {
  constructor(private readonly repo: ISurveyRepository) {}

  execute(): Promise<SurveyListItem[]> {
    return this.repo.listActive();
  }
}
