/** FR-AUTH-006: Sign up via email + password. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

export interface SignUpWithEmailInput {
  email: string;
  password: string;
  emailRedirectTo?: string;
}

export interface SignUpWithEmailOutput {
  session: AuthSession | null;
  pendingVerification: boolean;
}

export class SignUpWithEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: SignUpWithEmailInput): Promise<SignUpWithEmailOutput> {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    this.validate(email, password);

    const session = await this.auth.signUpWithEmail(email, password, {
      emailRedirectTo: input.emailRedirectTo,
    });
    return {
      session,
      pendingVerification: session === null,
    };
  }

  private validate(email: string, password: string): void {
    if (!EMAIL_RE.test(email)) {
      throw new AuthError('invalid_email', 'invalid_email');
    }
    if (password.length < MIN_PASSWORD_LEN) {
      throw new AuthError('weak_password', 'weak_password_too_short');
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLetter || !hasDigit) {
      throw new AuthError('weak_password', 'weak_password_letter_digit');
    }
  }
}
