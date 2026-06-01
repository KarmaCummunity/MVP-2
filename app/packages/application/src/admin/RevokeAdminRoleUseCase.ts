import { AdminRoleError } from '@kc/domain';
import type { IAdminRoleRepository } from './IAdminRoleRepository';

export interface RevokeAdminRoleInput {
  readonly grantId: string;
}

export class RevokeAdminRoleUseCase {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(input: RevokeAdminRoleInput): Promise<void> {
    if (!input.grantId) {
      throw new AdminRoleError('invalid_input', 'grant_id required');
    }
    await this.repo.revokeRole(input.grantId);
  }
}
