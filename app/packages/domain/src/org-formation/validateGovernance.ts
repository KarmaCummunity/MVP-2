// FR-ADMIN-021 — pure governance validation (Israel legal minimums).
//
// Critical rules block the "institutions" gate step from being completed; the DB
// enforces the same minimums on org_formation_set_step_progress. Warnings are
// surfaced prominently in the UI but never block.
import type { GovernanceAssignment } from './GovernanceAssignment';

export const MIN_BOARD_MEMBERS = 2;
export const MIN_AUDIT_MEMBERS = 1;

export type GovernanceRuleCode =
  | 'min_board'
  | 'min_audit'
  | 'no_overlap'
  | 'recommend_board_quorum'
  | 'recommend_audit_depth';

export type GovernanceSeverity = 'critical' | 'warning';

export interface GovernanceViolation {
  readonly code: GovernanceRuleCode;
  readonly severity: GovernanceSeverity;
}

export interface GovernanceValidation {
  readonly boardCount: number;
  readonly auditCount: number;
  readonly overlapCount: number;
  readonly violations: readonly GovernanceViolation[];
  readonly isGateSatisfied: boolean;
}

export function validateGovernance(
  assignments: readonly GovernanceAssignment[],
): GovernanceValidation {
  const board = new Set<string>();
  const audit = new Set<string>();
  for (const a of assignments) {
    if (a.governanceRole === 'board_member') board.add(a.userId);
    else audit.add(a.userId);
  }
  let overlapCount = 0;
  for (const id of board) if (audit.has(id)) overlapCount += 1;

  const violations: GovernanceViolation[] = [];
  if (board.size < MIN_BOARD_MEMBERS) violations.push({ code: 'min_board', severity: 'critical' });
  if (audit.size < MIN_AUDIT_MEMBERS) violations.push({ code: 'min_audit', severity: 'critical' });
  if (overlapCount > 0) violations.push({ code: 'no_overlap', severity: 'critical' });

  if (board.size === MIN_BOARD_MEMBERS) {
    violations.push({ code: 'recommend_board_quorum', severity: 'warning' });
  }
  if (audit.size === MIN_AUDIT_MEMBERS) {
    violations.push({ code: 'recommend_audit_depth', severity: 'warning' });
  }

  const isGateSatisfied = !violations.some((v) => v.severity === 'critical');
  return {
    boardCount: board.size,
    auditCount: audit.size,
    overlapCount,
    violations,
    isGateSatisfied,
  };
}
