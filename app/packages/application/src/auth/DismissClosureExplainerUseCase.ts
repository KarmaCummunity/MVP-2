/** FR-CLOSURE-004 AC3: persist `User.closureExplainerDismissed = true`. */
import type { IUserRepository } from '../ports/IUserRepository';

export interface DismissClosureExplainerInput {
  userId: string;
}

export class DismissClosureExplainerUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: DismissClosureExplainerInput): Promise<void> {
    await this.repo.dismissClosureExplainer(input.userId);
  }
}
