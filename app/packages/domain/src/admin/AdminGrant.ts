import type { AdminRole } from './AdminRole';

export interface AdminGrant {
  readonly grantId: string;
  readonly userId: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly role: AdminRole;
  readonly grantedAt: Date;
  readonly grantedBy: string | null;
  readonly grantedByDisplayName: string | null;
  readonly revokedAt: Date | null;
  readonly revokedBy: string | null;
  readonly lastSeenAt: Date | null;
}

export function isAdminGrantActive(g: AdminGrant): boolean {
  return g.revokedAt === null;
}

export type GrantableAdminRole = Extract<AdminRole, 'moderator' | 'support'>;

export const GRANTABLE_ADMIN_ROLES: readonly GrantableAdminRole[] = ['moderator', 'support'];

export function isGrantableAdminRole(role: AdminRole): role is GrantableAdminRole {
  return GRANTABLE_ADMIN_ROLES.includes(role as GrantableAdminRole);
}
