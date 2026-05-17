// FR-AUTH-003 + FR-AUTH-007 (web in-app sign-in via Google Identity Services).
// The id_token + nonce pair is produced client-side by GIS; this use case is the
// thin orchestration that hands them to the auth service and returns a session.
// docs/SSOT/spec/01_auth_and_onboarding.md
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

export interface SignInWithGoogleIdTokenInput {
  readonly idToken: string;
  readonly nonce: string;
}

export interface SignInWithGoogleIdTokenOutput {
  readonly session: AuthSession;
}

export class SignInWithGoogleIdTokenUseCase {
  constructor(private readonly auth: IAuthService) {}

  async execute(input: SignInWithGoogleIdTokenInput): Promise<SignInWithGoogleIdTokenOutput> {
    if (!input.idToken) throw new AuthError('unknown', 'id_token_missing');
    if (!input.nonce) throw new AuthError('unknown', 'nonce_missing');
    const session = await this.auth.signInWithIdToken({
      provider: 'google',
      idToken: input.idToken,
      nonce: input.nonce,
    });
    return { session };
  }
}
