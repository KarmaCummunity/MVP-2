import type { SupabaseClient } from '@supabase/supabase-js';
import { parseAdminRole, type AdminRole } from '@kc/domain';

/**
 * Calls the SECURITY DEFINER `get_my_admin_roles` RPC (migration 0115) and
 * parses the caller's active RBAC roles, dropping any unknown values.
 * Fail-closed: returns `[]` on any RPC error or non-array payload.
 *
 * Shared by the admin-role and moderation adapters so the parsing lives once
 * (avoids duplicated logic — SonarCloud new-code duplication gate).
 */
export async function fetchMyAdminRoles(client: SupabaseClient): Promise<readonly AdminRole[]> {
  const { data, error } = await client.rpc('get_my_admin_roles');
  if (error) return [];
  if (!Array.isArray(data)) return [];
  const out: AdminRole[] = [];
  for (const raw of data) {
    const parsed = parseAdminRole(typeof raw === 'string' ? raw : null);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}
