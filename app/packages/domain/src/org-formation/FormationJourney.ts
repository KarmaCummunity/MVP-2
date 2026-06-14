// FR-ADMIN-021 — nonprofit-formation journey entity (one per country).

export const FORMATION_JOURNEY_STATUSES = ['in_progress', 'registered', 'active'] as const;
export type FormationJourneyStatus = (typeof FORMATION_JOURNEY_STATUSES)[number];

export interface FormationJourney {
  readonly journeyId: string;
  readonly orgId: string;
  readonly countryCode: string;
  readonly status: FormationJourneyStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type FormationStepStatus = 'not_started' | 'in_progress' | 'done';

export const FORMATION_STEP_STATUSES: readonly FormationStepStatus[] = [
  'not_started',
  'in_progress',
  'done',
];

export function parseFormationStepStatus(
  value: string | null | undefined,
): FormationStepStatus {
  return value === 'in_progress' || value === 'done' ? value : 'not_started';
}
