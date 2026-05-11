// FR-SETTINGS-012 V1 — self-delete the currently authenticated user.

import type { IUserRepository } from '../ports/IUserRepository';

export class DeleteAccountUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(): Promise<void> {
    await this.repo.deleteAccountViaEdgeFunction();
  }
}
