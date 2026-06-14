// FR-ADMIN-021 — governance roster: board (vaad) / audit committee (vaadat bikoret).

export const GOVERNANCE_ROLES = ['board_member', 'audit_member'] as const;
export type GovernanceRole = (typeof GOVERNANCE_ROLES)[number];

export function parseGovernanceRole(value: string | null | undefined): GovernanceRole | null {
  if (value == null) return null;
  return (GOVERNANCE_ROLES as readonly string[]).includes(value)
    ? (value as GovernanceRole)
    : null;
}

export interface GovernanceAssignment {
  readonly assignmentId: string;
  readonly userId: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly governanceRole: GovernanceRole;
  readonly createdAt: Date;
}
