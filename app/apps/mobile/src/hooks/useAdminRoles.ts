// app/apps/mobile/src/hooks/useAdminRoles.ts
import { useQuery } from '@tanstack/react-query';
import type { AdminRole } from '@kc/domain';
import { container } from '../lib/container';
import { useAuthStore } from '../store/authStore';

const EMPTY: readonly AdminRole[] = [];

/**
 * Result of the admin-role query.
 *
 * `isLoading` distinguishes "query still resolving" from "resolved with no
 * roles". Gates MUST wait for `isLoading === false` before redirecting away,
 * otherwise a cold-start race redirects an authorised admin off /(admin)
 * before their role list lands (native is more sensitive than web because the
 * native stack does not retry resolution after a redirect).
 */
export interface AdminRolesState {
  readonly roles: readonly AdminRole[];
  readonly isLoading: boolean;
}

export function useAdminRoles(): AdminRolesState {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin.roles', userId],
    queryFn: () => container.getMyAdminRoles.execute(),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  // "Query disabled because no user yet" counts as loading too — gates must
  // not flash deny before AuthGate has restored the session.
  const loading = userId === null ? true : isLoading;
  return { roles: data ?? EMPTY, isLoading: loading };
}
