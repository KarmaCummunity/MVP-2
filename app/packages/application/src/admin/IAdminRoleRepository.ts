import type { AdminRole } from '@kc/domain';

export interface IAdminRoleRepository {
  getMyRoles(): Promise<readonly AdminRole[]>;
}
