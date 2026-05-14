import type { IAuthService, AuthSession } from '../../ports/IAuthService';
import { AuthError } from '../errors';

export class FakeAuthService implements IAuthService {
  signUpResult: AuthSession | null = null;
  signUpError: Error | null = null;

  signInResult: AuthSession | null = null;
  signInError: Error | null = null;

  currentSession: AuthSession | null = null;
  signOutCalled = 0;

  googleAuthUrl = 'https://example.com/oauth';
  googleAuthUrlError: Error | null = null;
  exchangeResult: AuthSession | null = null;
  exchangeError: Error | null = null;
  lastExchangeCode: string | null = null;

  public resendCalls: Array<{ email: string; emailRedirectTo?: string }> = [];
  public verifyEmailResult: AuthSession | null = null;
  public verifyEmailCalls: string[] = [];
  public lastSignUpRedirect: string | undefined;

  async signUpWithEmail(
    _email: string,
    _password: string,
    options?: { emailRedirectTo?: string },
  ): Promise<AuthSession | null> {
    if (this.signUpError) throw this.signUpError;
    this.lastSignUpRedirect = options?.emailRedirectTo;
    return this.signUpResult;
  }

  signInWithEmail = async (_email: string, _password: string): Promise<AuthSession> => {
    if (this.signInError) throw this.signInError;
    if (!this.signInResult) throw new Error('no signInResult configured');
    return this.signInResult;
  };

  signOut = async (): Promise<void> => {
    this.signOutCalled += 1;
    this.currentSession = null;
  };

  getCurrentSession = async (): Promise<AuthSession | null> => this.currentSession;

  onSessionChange = (_listener: (s: AuthSession | null) => void): (() => void) => () => undefined;

  getGoogleAuthUrl = async (_redirectTo: string): Promise<string> => {
    if (this.googleAuthUrlError) throw this.googleAuthUrlError;
    return this.googleAuthUrl;
  };

  exchangeCodeForSession = async (code: string): Promise<AuthSession> => {
    this.lastExchangeCode = code;
    if (this.exchangeError) throw this.exchangeError;
    if (!this.exchangeResult) throw new Error('no exchangeResult configured');
    return this.exchangeResult;
  };

  async resendVerificationEmail(
    email: string,
    options?: { emailRedirectTo?: string },
  ): Promise<void> {
    this.resendCalls.push({ email, emailRedirectTo: options?.emailRedirectTo });
  }

  async verifyEmail(tokenHash: string): Promise<AuthSession> {
    this.verifyEmailCalls.push(tokenHash);
    if (!this.verifyEmailResult) {
      throw new AuthError('unknown', 'fake_no_verify_result');
    }
    return this.verifyEmailResult;
  }
}

export function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    userId: 'u_1',
    email: 'a@b.co',
    emailVerified: true,
    accessToken: 'tok',
    refreshToken: 'ref',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    displayName: null,
    avatarUrl: null,
    ...overrides,
  };
}
