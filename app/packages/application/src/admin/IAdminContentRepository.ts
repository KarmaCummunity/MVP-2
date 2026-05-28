import type {
  AdminAuditRow,
  AdminPostSearchResult,
  AdminSearchPage,
  AdminUserSearchResult,
} from '@kc/domain';

export interface AdminUserSearchFilters {
  readonly query?: string;
  readonly status?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface AdminPostSearchFilters {
  readonly query?: string;
  readonly status?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface AdminAuditSearchFilters {
  readonly targetUserId?: string;
  readonly actorId?: string;
  readonly action?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface IAdminContentRepository {
  searchUsers(filters: AdminUserSearchFilters): Promise<AdminSearchPage<AdminUserSearchResult>>;
  searchPosts(filters: AdminPostSearchFilters): Promise<AdminSearchPage<AdminPostSearchResult>>;
  searchAudit(filters: AdminAuditSearchFilters): Promise<AdminSearchPage<AdminAuditRow>>;
}
