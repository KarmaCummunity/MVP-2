import type { AdminPostSearchResult, AdminSearchPage } from '@kc/domain';
import type {
  AdminPostSearchFilters,
  IAdminContentRepository,
} from './IAdminContentRepository';

export class AdminSearchPostsUseCase {
  constructor(private readonly repo: IAdminContentRepository) {}

  async execute(
    filters: AdminPostSearchFilters,
  ): Promise<AdminSearchPage<AdminPostSearchResult>> {
    return this.repo.searchPosts(filters);
  }
}
