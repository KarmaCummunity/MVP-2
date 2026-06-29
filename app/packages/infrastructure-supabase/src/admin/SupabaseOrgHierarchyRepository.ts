import type { SupabaseClient } from '@supabase/supabase-js';
import type { IOrgHierarchyRepository } from '@kc/application';
import {
  type OrgTreeMember,
  OrgHierarchyError,
  type OrgHierarchyErrorCode,
  parseAdminRole,
} from '@kc/domain';

interface OrgTreeRow {
  grant_id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  scope_org_id: string | null;
  effective_org_id: string | null;
  org_name: string | null;
  is_platform: boolean | null;
  manager_grant_id: string | null;
  last_seen_at: string | null;
}

const KNOWN_ERROR_MESSAGES: ReadonlySet<OrgHierarchyErrorCode> = new Set([
  'forbidden',
  'forbidden_manage',
  'invalid_input',
  'invalid_manager',
  'grant_not_found',
  'grant_already_revoked',
  'manager_not_found',
  'manager_revoked',
  'manager_other_org',
  'manager_cycle',
]);

function mapRpcError(err: { message?: string; code?: string } | null): OrgHierarchyError {
  const raw = err?.message ?? '';
  if ((KNOWN_ERROR_MESSAGES as Set<string>).has(raw)) {
    return new OrgHierarchyError(raw as OrgHierarchyErrorCode, raw);
  }
  if (err?.code === '42501') {
    return new OrgHierarchyError('forbidden', 'forbidden');
  }
  return new OrgHierarchyError('unknown', raw || 'unknown_org_hierarchy_rpc_error');
}

function mapRow(row: OrgTreeRow): OrgTreeMember | null {
  const role = parseAdminRole(row.role);
  if (role === null) return null;
  return {
    grantId: row.grant_id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role,
    scopeOrgId: row.scope_org_id,
    orgId: row.effective_org_id,
    orgName: row.org_name,
    isPlatform: row.is_platform === true,
    managerGrantId: row.manager_grant_id,
    lastSeenAt: row.last_seen_at === null ? null : new Date(row.last_seen_at),
  };
}

export class SupabaseOrgHierarchyRepository implements IOrgHierarchyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getOrgTree(orgId: string | null): Promise<readonly OrgTreeMember[]> {
    const { data, error } = await this.client.rpc('admin_org_tree', {
      p_org_id: orgId,
    });
    if (error) throw mapRpcError(error);
    if (!Array.isArray(data)) return [];
    const out: OrgTreeMember[] = [];
    for (const raw of data as OrgTreeRow[]) {
      const mapped = mapRow(raw);
      if (mapped !== null) out.push(mapped);
    }
    return out;
  }

  async setManager(grantId: string, managerGrantId: string | null): Promise<void> {
    const { error } = await this.client.rpc('admin_set_manager', {
      p_grant_id: grantId,
      p_manager_grant_id: managerGrantId,
    });
    if (error) throw mapRpcError(error);
  }
}
