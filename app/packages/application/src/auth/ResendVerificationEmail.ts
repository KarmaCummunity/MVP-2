/** FR-AUTH-006 (MVP gate): resend signup verification email. */
import type { IAuthService } from '../ports/IAuthService';
import { AuthError } from './errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ResendVerificationEmailInput {
  email: string;
  emailRedirectTo?: string;
}

export class ResendVerificationEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: ResendVerificationEmailInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new AuthError('invalid_email', 'invalid_email');
    }
    await this.auth.resendVerificationEmail(email, {
      emailRedirectTo: input.emailRedirectTo,
    });
  }
}
