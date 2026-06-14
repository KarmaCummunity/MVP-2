// FR-ADMIN-021 — use cases for the nonprofit-formation journey.
import type {
  FormationJourney,
  FormationStep,
  GovernanceAssignment,
} from '@kc/domain';
import type {
  AssignGovernanceInput,
  IOrgFormationRepository,
  SetStepProgressInput,
  UpdateStepContentInput,
} from './IOrgFormationRepository';

export class GetFormationJourneyUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(countryCode: string): Promise<FormationJourney> {
    return this.repo.getJourney(countryCode);
  }
}

export class ListFormationStepsUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(journeyId: string): Promise<readonly FormationStep[]> {
    return this.repo.listSteps(journeyId);
  }
}

export class ListGovernanceUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(journeyId: string): Promise<readonly GovernanceAssignment[]> {
    return this.repo.listGovernance(journeyId);
  }
}

export class SetStepProgressUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(input: SetStepProgressInput): Promise<void> {
    return this.repo.setStepProgress(input);
  }
}

export class UpdateStepContentUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(input: UpdateStepContentInput): Promise<void> {
    return this.repo.updateStepContent(input);
  }
}

export class AssignGovernanceMemberUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(input: AssignGovernanceInput): Promise<string> {
    return this.repo.assignMember(input);
  }
}

export class RemoveGovernanceMemberUseCase {
  constructor(private readonly repo: IOrgFormationRepository) {}
  execute(assignmentId: string): Promise<void> {
    return this.repo.removeMember(assignmentId);
  }
}
