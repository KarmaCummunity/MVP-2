import type { Organization } from '@kc/domain';
import type { IOrganizationRepository } from './IOrganizationRepository';

/** Lists the organizations the current user belongs to (default org first). */
export class GetMyOrganizationsUseCase {
  constructor(private readonly repo: IOrganizationRepository) {}

  async execute(): Promise<readonly Organization[]> {
    return this.repo.listMine();
  }
}
