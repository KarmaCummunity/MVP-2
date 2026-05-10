/**
 * FR-ADMIN-009 — UI-only convenience flag. The server re-checks via
 * is_admin(auth.uid()) inside the admin_remove_post RPC, so a tampered
 * client cannot escalate. We cache for the session lifetime — admin
 * promotion is a manual SQL operation that requires a session restart
 * to take effect anyway.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/container';
import { useAuthStore } from '../store/authStore';

async function fetchIsSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // RLS lets a user read their own row; if this fails, treat as non-admin.
    return false;
  }
  return data?.is_super_admin === true;
}

export function useIsSuperAdmin(): boolean {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const { data } = useQuery({
    queryKey: ['users.is_super_admin', userId],
    queryFn: () => fetchIsSuperAdmin(userId as string),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  return data === true;
}
