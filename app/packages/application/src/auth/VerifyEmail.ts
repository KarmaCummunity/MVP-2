/** FR-AUTH-006 (MVP gate): exchange the email-verification token for a session. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

export interface VerifyEmailInput {
  tokenHash: string;
}

export interface VerifyEmailOutput {
  session: AuthSession;
}

export class VerifyEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    if (!input.tokenHash || input.tokenHash.trim().length === 0) {
      throw new AuthError('unknown', 'verify_token_missing');
    }
    const session = await this.auth.verifyEmail(input.tokenHash);
    return { session };
  }
}
