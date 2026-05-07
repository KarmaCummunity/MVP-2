/** FR-AUTH-013: Restore persisted session on cold start. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';

export interface RestoreSessionOutput {
  session: AuthSession | null;
}

export class RestoreSessionUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(): Promise<RestoreSessionOutput> {
    const session = await this.auth.getCurrentSession();
    if (!session) return { session: null };

    const nowSec = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= nowSec) {
      return { session: null };
    }
    return { session };
  }
}
