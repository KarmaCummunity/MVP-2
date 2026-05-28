import type { AdminSearchPage, AdminUserSearchResult } from '@kc/domain';
import type {
  AdminUserSearchFilters,
  IAdminContentRepository,
} from './IAdminContentRepository';

export class AdminSearchUsersUseCase {
  constructor(private readonly repo: IAdminContentRepository) {}

  async execute(
    filters: AdminUserSearchFilters,
  ): Promise<AdminSearchPage<AdminUserSearchResult>> {
    return this.repo.searchUsers(filters);
  }
}
