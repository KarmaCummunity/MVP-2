import {
  AdminRoleError,
  type GrantableAdminRole,
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
    return this.repo.grantRole(input.targetUserId, input.role);
  }
}
