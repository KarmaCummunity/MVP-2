import type { AdminGrant } from '@kc/domain';
import type { IAdminRoleRepository } from './IAdminRoleRepository';

export interface ListAdminsInput {
  readonly includeRevoked: boolean;
}

export class ListAdminsUseCase {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: ListAdminsInput): Promise<readonly AdminGrant[]> {
    return this.repo.listAdmins(input.includeRevoked);
  }
}
