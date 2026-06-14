// FR-ADMIN-021 — domain error for the org-formation journey.

export type OrgFormationErrorCode =
  | 'forbidden'
  | 'invalid_country'
  | 'invalid_status'
  | 'invalid_tips'
  | 'invalid_governance_role'
  | 'journey_not_found'
  | 'step_not_found'
  | 'target_not_found'
  | 'target_not_active'
  | 'governance_overlap'
  | 'governance_incomplete'
  | 'member_already_assigned'
  | 'assignment_not_found'
  | 'unknown';

export class OrgFormationError extends Error {
  constructor(public readonly code: OrgFormationErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'OrgFormationError';
  }
}

export function isOrgFormationError(value: unknown): value is OrgFormationError {
  return value instanceof OrgFormationError;
}
