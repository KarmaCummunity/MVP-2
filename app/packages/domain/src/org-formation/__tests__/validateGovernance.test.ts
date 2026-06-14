import { describe, expect, it } from 'vitest';
import { validateGovernance } from '../validateGovernance';
import type { GovernanceAssignment } from '../GovernanceAssignment';
import { formationProgressPercent } from '../FormationStep';
import type { FormationStep } from '../FormationStep';
import { OrgFormationError, isOrgFormationError } from '../OrgFormationError';

function member(userId: string, role: 'board_member' | 'audit_member'): GovernanceAssignment {
  return {
    assignmentId: `${userId}-${role}`,
    userId,
    displayName: userId,
    avatarUrl: null,
    governanceRole: role,
    createdAt: new Date(),
  };
}

describe('validateGovernance', () => {
  it('flags missing board and audit on an empty roster', () => {
    const v = validateGovernance([]);
    expect(v.isGateSatisfied).toBe(false);
    const codes = v.violations.map((x) => x.code);
    expect(codes).toContain('min_board');
    expect(codes).toContain('min_audit');
  });

  it('satisfies the gate with 2 board + 1 audit and no overlap', () => {
    const v = validateGovernance([
      member('a', 'board_member'),
      member('b', 'board_member'),
      member('c', 'audit_member'),
    ]);
    expect(v.boardCount).toBe(2);
    expect(v.auditCount).toBe(1);
    expect(v.isGateSatisfied).toBe(true);
    // boundary minimums still emit warnings (non-blocking).
    expect(v.violations.every((x) => x.severity === 'warning')).toBe(true);
  });

  it('blocks the gate when a person serves on both board and audit (§30)', () => {
    const v = validateGovernance([
      member('a', 'board_member'),
      member('b', 'board_member'),
      member('a', 'audit_member'),
    ]);
    expect(v.overlapCount).toBe(1);
    expect(v.isGateSatisfied).toBe(false);
    expect(v.violations.some((x) => x.code === 'no_overlap')).toBe(true);
  });
});

describe('formationProgressPercent', () => {
  const step = (status: FormationStep['progressStatus']): FormationStep => ({
    stepId: status, stepKey: status, sortOrder: 0, titleFallback: '', bodyText: '',
    tips: [], isCriticalGate: false, progressStatus: status, progressNote: null,
  });

  it('returns 0 for an empty list', () => {
    expect(formationProgressPercent([])).toBe(0);
  });

  it('rounds the done ratio to a percent', () => {
    expect(formationProgressPercent([step('done'), step('not_started'), step('in_progress')])).toBe(33);
  });
});

describe('OrgFormationError', () => {
  it('carries its code and narrows', () => {
    const e = new OrgFormationError('governance_incomplete');
    expect(e.code).toBe('governance_incomplete');
    expect(isOrgFormationError(e)).toBe(true);
    expect(isOrgFormationError(new Error('x'))).toBe(false);
  });
});
