/** FR-AUTH-003+007 (Google OAuth PKCE): Supabase auto-routes by `sub` — new user → sign up, existing → sign in. */
import type { IAuthService, AuthSession } from '../ports/IAuthService';
import { AuthError } from './errors';

/**
 * Browser opener port. Implementations open `url` in a system browser, wait for
 * the user to be redirected back to `redirectTo`, and resolve with the redirect URL
 * (or `null` if the user dismissed the browser).
 *
 * On native (iOS/Android) the mobile composition root injects an implementation that
 * wraps `WebBrowser.openAuthSessionAsync`, which keeps control inside JS — this use
 * case completes end-to-end in one turn.
 *
 * On web, the same wrapper triggers a top-level navigation to the OAuth provider, so
 * the JS context is destroyed before this use case can resolve. The OAuth round-trip
 * is then completed by the dedicated `/auth/callback` route, which calls
 * `IAuthService.exchangeCodeForSession` directly. This use case is therefore mainly
 * exercised on native; on web only `IAuthService.getGoogleAuthUrl` runs before the
 * navigation.
 */
export type OpenAuthSession = (
  url: string,
  redirectTo: string,
) => Promise<string | null>;

export interface SignInWithGoogleInput {
  /** Deep link the OAuth provider redirects to after sign-in. */
  redirectTo: string;
}

export interface SignInWithGoogleOutput {
  session: AuthSession;
}

export class SignInWithGoogleUseCase {
  constructor(
    private readonly auth: IAuthService,
    private readonly openAuthSession: OpenAuthSession,
  ) {}

  async execute(input: SignInWithGoogleInput): Promise<SignInWithGoogleOutput> {
    const url = await this.auth.getGoogleAuthUrl(input.redirectTo);
    const redirectUrl = await this.openAuthSession(url, input.redirectTo);
    if (!redirectUrl) {
      throw new AuthError('unknown', 'oauth_dismissed');
    }
    const code = extractCode(redirectUrl);
    if (!code) {
      throw new AuthError('unknown', 'oauth_no_code');
    }
    const session = await this.auth.exchangeCodeForSession(code);
    return { session };
  }
}

function extractCode(redirectUrl: string): string | null {
  const qIdx = redirectUrl.indexOf('?');
  if (qIdx === -1) return null;
  const search = redirectUrl.slice(qIdx + 1);
  for (const part of search.split('&')) {
    const [k, v] = part.split('=');
    if (k === 'code' && v) return decodeURIComponent(v);
  }
  return null;
}
