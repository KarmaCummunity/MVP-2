/** FR-AUTH-004 (iOS Apple SSO): native Sign in with Apple → Supabase session. */
import type { AppleIdentityCredential, AuthSession, IAuthService } from '../ports/IAuthService';
import { AuthError } from './errors';

/**
 * Result of the native Sign in with Apple authorization sheet, provided by the
 * mobile composition root (backed by `expo-apple-authentication` + `expo-crypto`).
 */
export interface AppleSignInResult extends AppleIdentityCredential {
  /**
   * Apple delivers the user's name only on the FIRST authorization (AC3); it is
   * `null` on every subsequent sign-in. Used to prefill the onboarding wizard.
   */
  readonly fullName?: string | null;
}

/**
 * Drives the native authorization sheet. Resolves with the credential, or `null`
 * if the user cancelled the sheet (no error is surfaced for a deliberate cancel).
 */
export type PerformAppleSignIn = () => Promise<AppleSignInResult | null>;

export interface SignInWithAppleOutput {
  session: AuthSession;
}

export class SignInWithAppleUseCase {
  constructor(
    private readonly auth: IAuthService,
    private readonly performAppleSignIn: PerformAppleSignIn,
  ) {}

  async execute(): Promise<SignInWithAppleOutput> {
    const credential = await this.performAppleSignIn();
    if (!credential) {
      throw new AuthError('unknown', 'apple_dismissed');
    }
    const session = await this.auth.signInWithApple({
      identityToken: credential.identityToken,
      rawNonce: credential.rawNonce,
    });
    // FR-AUTH-004 AC3: Apple never re-delivers the name, so persist it for
    // onboarding prefill only on the first authorization and only when the
    // profile has no display name yet.
    const fullName = credential.fullName?.trim();
    if (fullName && !session.displayName) {
      await this.auth.syncProfileMetadata({ displayName: fullName });
      return { session: { ...session, displayName: fullName } };
    }
    return { session };
  }
}
