import type { AdminGrant, AdminRole, GrantableAdminRole } from '@kc/domain';

export interface IAdminRoleRepository {
  getMyRoles(): Promise<readonly AdminRole[]>;
  listAdmins(includeRevoked: boolean): Promise<readonly AdminGrant[]>;
  grantRole(targetUserId: string, role: GrantableAdminRole): Promise<string>;
  revokeRole(grantId: string): Promise<void>;
}
