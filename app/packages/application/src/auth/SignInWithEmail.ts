/** FR-AUTH-007 (email path): Sign in via email + password. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignInWithEmailInput {
  email: string;
  password: string;
}

export interface SignInWithEmailOutput {
  session: AuthSession;
}

export class SignInWithEmailUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: SignInWithEmailInput): Promise<SignInWithEmailOutput> {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!EMAIL_RE.test(email)) {
      throw new AuthError('invalid_email', 'invalid_email');
    }
    if (password.length === 0) {
      throw new AuthError('invalid_credentials', 'password_required');
    }

    const session = await this.auth.signInWithEmail(email, password);
    return { session };
  }
}
