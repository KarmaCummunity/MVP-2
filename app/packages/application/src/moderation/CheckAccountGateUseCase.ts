/** FR-MOD-010 — check if a user account is allowed to perform write actions. */
import type {
  AccountGateResult,
  IAccountGateRepository,
} from '../ports/IAccountGateRepository';

export interface CheckAccountGateInput {
  userId: string;
}

export class CheckAccountGateUseCase {
  constructor(private readonly repo: IAccountGateRepository) {}

  async execute(input: CheckAccountGateInput): Promise<AccountGateResult> {
    return this.repo.checkAccountGate(input.userId);
  }
}
