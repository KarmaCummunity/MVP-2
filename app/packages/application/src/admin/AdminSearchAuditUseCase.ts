import type { AdminAuditRow, AdminSearchPage } from '@kc/domain';
import type {
  AdminAuditSearchFilters,
  IAdminContentRepository,
} from './IAdminContentRepository';

export class AdminSearchAuditUseCase {
  constructor(private readonly repo: IAdminContentRepository) {}

  async execute(filters: AdminAuditSearchFilters): Promise<AdminSearchPage<AdminAuditRow>> {
    return this.repo.searchAudit(filters);
  }
}
