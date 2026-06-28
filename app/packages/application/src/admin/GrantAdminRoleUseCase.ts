import {
  AdminRoleError,
  type GrantableAdminRole,
  hasPermission,
  isGrantableAdminRole,
} from '@kc/domain';
import type { IAdminRoleRepository } from './IAdminRoleRepository';

export interface GrantAdminRoleInput {
  readonly targetUserId: string;
  readonly role: GrantableAdminRole;
}

export class GrantAdminRoleUseCase {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: GrantAdminRoleInput): Promise<string> {
    if (!input.targetUserId) {
      throw new AdminRoleError('invalid_input', 'target_user_id required');
    }
    if (!isGrantableAdminRole(input.role)) {
      throw new AdminRoleError('invalid_role', 'role must be moderator or support');
    }
    // Defence-in-depth (FR-ADMIN-006): granting a role requires
    // `admins.grant_role` (super_admin) per the PERMISSION_MATRIX. The DB
    // `can_grant_role`/RLS already enforce this; checking here fails an
    // unauthorized caller fast with a typed error.
    const roles = await this.repo.getMyRoles();
    if (!hasPermission(roles, 'admins.grant_role')) {
      throw new AdminRoleError('forbidden', 'caller lacks admins.grant_role');
    }
    return this.repo.grantRole(input.targetUserId, input.role);
  }
}
