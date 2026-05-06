// ─────────────────────────────────────────────
// Use case: Sign out current user.
// Mapped to SRS: FR-AUTH-017
// ─────────────────────────────────────────────

import type { IAuthService } from '../ports/IAuthService';

export class SignOutUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(): Promise<void> {
    await this.auth.signOut();
  }
}
