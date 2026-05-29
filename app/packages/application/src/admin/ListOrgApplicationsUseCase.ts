import type { OrgApplicationPage } from '@kc/domain';
import type {
  IOrgApplicationsRepository,
  OrgApplicationListFilters,
} from './IOrgApplicationsRepository';

export class ListOrgApplicationsUseCase {
  constructor(private readonly repo: IOrgApplicationsRepository) {}

  async execute(filters: OrgApplicationListFilters): Promise<OrgApplicationPage> {
    return this.repo.list(filters);
  }
}
