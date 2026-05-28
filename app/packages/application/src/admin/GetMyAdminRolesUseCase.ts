import type { AdminRole } from '@kc/domain';
import type { IAdminRoleRepository } from './IAdminRoleRepository';

export class GetMyAdminRolesUseCase {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(): Promise<readonly AdminRole[]> {
    return this.repo.getMyRoles();
  }
}
