import { OrgApplicationError } from '@kc/domain';
import type { IOrgApplicationsRepository } from './IOrgApplicationsRepository';

export interface DecideOrgApplicationInput {
  readonly applicationId: string;
  readonly approve: boolean;
  readonly note?: string | null;
}

export class DecideOrgApplicationUseCase {
  constructor(private readonly repo: IOrgApplicationsRepository) {}

  async execute(input: DecideOrgApplicationInput): Promise<void> {
    if (!input.applicationId) {
      throw new OrgApplicationError('application_not_found', 'application_id required');
    }
    if (input.approve) {
      await this.repo.approve(input.applicationId, input.note ?? null);
    } else {
      await this.repo.reject(input.applicationId, input.note ?? null);
    }
  }
}
