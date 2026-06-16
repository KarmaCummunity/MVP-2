import { hasPermission, OrgHierarchyError, type AdminRole } from '@kc/domain';
import type { IAdminRoleRepository } from './IAdminRoleRepository';
import type { IOrgHierarchyRepository } from './IOrgHierarchyRepository';

export interface SetManagerInput {
  readonly grantId: string;
  /** null clears the manager (detaches to a tree root). */
  readonly managerGrantId: string | null;
}

export class SetManagerUseCase {
  constructor(
    private readonly repo: IOrgHierarchyRepository,
    private readonly roleRepo: IAdminRoleRepository,
  ) {}

  async execute(input: SetManagerInput): Promise<void> {
    if (!input.grantId) {
      throw new OrgHierarchyError('invalid_input', 'grant_id required');
    }
    if (input.managerGrantId !== null && input.managerGrantId === input.grantId) {
      throw new OrgHierarchyError('invalid_manager', 'a grant cannot manage itself');
    }
    // Defence-in-depth: the assign-manager UI is gated on `admins.set_manager`.
    // The RPC re-checks the scoped authority (can_grant_role) — this fails an
    // obviously-unauthorized caller fast with a typed error.
    const roles: readonly AdminRole[] = await this.roleRepo.getMyRoles();
    if (!hasPermission(roles, 'admins.set_manager')) {
      throw new OrgHierarchyError('forbidden_manage', 'caller lacks admins.set_manager');
    }
    return this.repo.setManager(input.grantId, input.managerGrantId);
  }
}
