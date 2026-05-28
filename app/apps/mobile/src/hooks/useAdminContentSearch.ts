// app/apps/mobile/src/hooks/useAdminContentSearch.ts
// FR-ADMIN-019 / FR-ADMIN-020 — admin content search hooks (users, posts, audit).
import { useQuery } from '@tanstack/react-query';
import type {
  AdminAuditRow, AdminPostSearchResult, AdminSearchPage, AdminUserSearchResult,
} from '@kc/domain';
import type {
  AdminAuditSearchFilters, AdminPostSearchFilters, AdminUserSearchFilters,
} from '@kc/application';
import { container } from '../lib/container';

const EMPTY_USERS: AdminSearchPage<AdminUserSearchResult> = { rows: [], totalCount: 0 };
const EMPTY_POSTS: AdminSearchPage<AdminPostSearchResult> = { rows: [], totalCount: 0 };
const EMPTY_AUDIT: AdminSearchPage<AdminAuditRow>        = { rows: [], totalCount: 0 };

export function useAdminUserSearch(filters: AdminUserSearchFilters) {
  const q = useQuery({
    queryKey: ['admin.search.users', filters],
    queryFn:  () => container.adminSearchUsers.execute(filters),
    staleTime: 30_000,
  });
  return {
    page:         q.data ?? EMPTY_USERS,
    isLoading:    q.isLoading,
    isRefetching: q.isRefetching,
    refetch:      () => { void q.refetch(); },
    error:        q.error,
  };
}

export function useAdminPostSearch(filters: AdminPostSearchFilters) {
  const q = useQuery({
    queryKey: ['admin.search.posts', filters],
    queryFn:  () => container.adminSearchPosts.execute(filters),
    staleTime: 30_000,
  });
  return {
    page:         q.data ?? EMPTY_POSTS,
    isLoading:    q.isLoading,
    isRefetching: q.isRefetching,
    refetch:      () => { void q.refetch(); },
    error:        q.error,
  };
}

export function useAdminAuditSearch(filters: AdminAuditSearchFilters) {
  const q = useQuery({
    queryKey: ['admin.search.audit', filters],
    queryFn:  () => container.adminSearchAudit.execute(filters),
    staleTime: 30_000,
  });
  return {
    page:         q.data ?? EMPTY_AUDIT,
    isLoading:    q.isLoading,
    isRefetching: q.isRefetching,
    refetch:      () => { void q.refetch(); },
    error:        q.error,
  };
}
