// FR-ADMIN-021 — port for the nonprofit-formation journey.
import type {
  FormationJourney,
  FormationStep,
  FormationStepStatus,
  GovernanceAssignment,
  GovernanceRole,
} from '@kc/domain';

export interface SetStepProgressInput {
  readonly journeyId: string;
  readonly stepKey: string;
  readonly status: FormationStepStatus;
  readonly note?: string | null;
}

export interface UpdateStepContentInput {
  readonly stepId: string;
  readonly bodyText: string;
  readonly tips: readonly string[];
}

export interface AssignGovernanceInput {
  readonly journeyId: string;
  readonly userId: string;
  readonly governanceRole: GovernanceRole;
}

export interface IOrgFormationRepository {
  getJourney(countryCode: string): Promise<FormationJourney>;
  listSteps(journeyId: string): Promise<readonly FormationStep[]>;
  listGovernance(journeyId: string): Promise<readonly GovernanceAssignment[]>;
  setStepProgress(input: SetStepProgressInput): Promise<void>;
  updateStepContent(input: UpdateStepContentInput): Promise<void>;
  assignMember(input: AssignGovernanceInput): Promise<string>;
  removeMember(assignmentId: string): Promise<void>;
}
