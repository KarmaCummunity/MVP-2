// app/apps/mobile/src/hooks/useAdminRoles.ts
import { useQuery } from '@tanstack/react-query';
import type { AdminRole } from '@kc/domain';
import { container } from '../lib/container';
import { useAuthStore } from '../store/authStore';

const EMPTY: readonly AdminRole[] = [];

export function useAdminRoles(): readonly AdminRole[] {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const { data } = useQuery({
    queryKey: ['admin.roles', userId],
    queryFn: () => container.getMyAdminRoles.execute(),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  return data ?? EMPTY;
}
