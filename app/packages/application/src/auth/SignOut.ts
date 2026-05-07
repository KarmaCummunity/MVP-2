/** FR-AUTH-017: Sign out current user. */
import type { IAuthService } from '../ports/IAuthService';

export class SignOutUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(): Promise<void> {
    await this.auth.signOut();
  }
}
