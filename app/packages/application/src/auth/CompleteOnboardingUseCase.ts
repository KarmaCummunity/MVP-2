/** FR-AUTH-012 AC3: Set onboarding_state to 'completed'. Idempotent. */
import type { IUserRepository } from '../ports/IUserRepository';

export interface CompleteOnboardingInput {
  readonly userId: string;
}

export class CompleteOnboardingUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CompleteOnboardingInput): Promise<void> {
    await this.users.setOnboardingState(input.userId, 'completed');
  }
}
