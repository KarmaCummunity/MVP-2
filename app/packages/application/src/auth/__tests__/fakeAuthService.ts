import type { IAuthService, AuthSession } from '../../ports/IAuthService';

export class FakeAuthService implements IAuthService {
  signUpResult: AuthSession | null = null;
  signUpError: Error | null = null;

  signInResult: AuthSession | null = null;
  signInError: Error | null = null;

  currentSession: AuthSession | null = null;
  signOutCalled = 0;

  signUpWithEmail = async (_email: string, _password: string): Promise<AuthSession | null> => {
    if (this.signUpError) throw this.signUpError;
    return this.signUpResult;
  };

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
}

export function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    userId: 'u_1',
    email: 'a@b.co',
    emailVerified: true,
    accessToken: 'tok',
    refreshToken: 'ref',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}
