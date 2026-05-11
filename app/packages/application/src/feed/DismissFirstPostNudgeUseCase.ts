/**
 * DismissFirstPostNudgeUseCase — permanently hide the first-post nudge for a user.
 * Mapped to FR-FEED-015 AC3 (don't-show-again path).
 *
 * The two soft-dismiss paths described in the spec — "remind me later" (one
 * session) and the X icon — are handled entirely in the UI's session store
 * and never reach this use case. Only the permanent dismissal updates the
 * database.
 *
 * Idempotent: re-running on an already-dismissed user simply re-writes the
 * same flag.
 */

import type { IUserRepository } from '../ports/IUserRepository';

export class DismissFirstPostNudgeUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('DismissFirstPostNudgeUseCase: userId is required');
    }
    await this.users.update(userId, { firstPostNudgeDismissed: true });
  }
}
