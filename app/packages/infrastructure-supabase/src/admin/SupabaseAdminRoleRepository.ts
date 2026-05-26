import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAdminRoleRepository } from '@kc/application';
import { type AdminRole, parseAdminRole } from '@kc/domain';

export class SupabaseAdminRoleRepository implements IAdminRoleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getMyRoles(): Promise<readonly AdminRole[]> {
    const { data, error } = await this.client.rpc('get_my_admin_roles');
    if (error) return [];
    if (!Array.isArray(data)) return [];
    const out: AdminRole[] = [];
    for (const raw of data) {
      const parsed = parseAdminRole(typeof raw === 'string' ? raw : null);
      if (parsed !== null) out.push(parsed);
    }
    return out;
  }
}
