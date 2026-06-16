// app/apps/mobile/src/hooks/useAdminPerson.ts
// FR-ADMIN-022 — resolve a single AdminPerson from the cached admins list.
// Reused by the admin-detail screen and the profile → admin-card cross-link,
// so neither needs a dedicated RPC (Phase 1 stays schema-free).
import { useMemo } from 'react';
import { type AdminPerson, groupGrantsByUser } from '@kc/domain';
import { useAdminsList } from './useAdminsList';

export interface AdminPersonState {
  readonly person: AdminPerson | null;
  readonly isLoading: boolean;
  readonly refetch: () => void;
  readonly error: unknown;
}

export function useAdminPerson(userId: string | undefined, enabled = true): AdminPersonState {
  // Always include revoked so a fully-revoked user is still resolvable by id.
  const list = useAdminsList(true, enabled && Boolean(userId));
  const person = useMemo(() => {
    if (!userId) return null;
    return groupGrantsByUser(list.grants).find((p) => p.userId === userId) ?? null;
  }, [list.grants, userId]);

  return { person, isLoading: list.isLoading, refetch: list.refetch, error: list.error };
}
