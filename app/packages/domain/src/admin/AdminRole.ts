export const KNOWN_ADMIN_ROLES = [
  'super_admin', 'moderator', 'support',
  'operator', 'operators_manager',
  'org_admin', 'org_manager', 'org_employee',
  'volunteer_manager', 'org_volunteer',
  'org_board_member', 'org_audit_member',
] as const;

export type AdminRole = (typeof KNOWN_ADMIN_ROLES)[number];

export function parseAdminRole(value: string | null | undefined): AdminRole | null {
  if (value == null) return null;
  return (KNOWN_ADMIN_ROLES as readonly string[]).includes(value)
    ? (value as AdminRole)
    : null;
}
