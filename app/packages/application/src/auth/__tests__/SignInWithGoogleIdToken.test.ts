import { describe, expect, it } from 'vitest';
import { SignInWithGoogleIdTokenUseCase } from '../SignInWithGoogleIdToken';
import { AuthError } from '../errors';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('SignInWithGoogleIdTokenUseCase', () => {
  it('forwards id_token + nonce to IAuthService.signInWithIdToken and returns the session', async () => {
    const auth = new FakeAuthService();
    auth.idTokenResult = makeSession({ userId: 'u_g' });
    const uc = new SignInWithGoogleIdTokenUseCase(auth);

    const out = await uc.execute({ idToken: 'eyJID', nonce: 'r4nd0m' });

    expect(out.session).toBe(auth.idTokenResult);
    expect(auth.lastIdTokenInput).toEqual({
      provider: 'google',
      idToken: 'eyJID',
      nonce: 'r4nd0m',
    });
  });

  it('throws id_token_missing when idToken is empty', async () => {
    const auth = new FakeAuthService();
    const uc = new SignInWithGoogleIdTokenUseCase(auth);

    await expect(uc.execute({ idToken: '', nonce: 'n' })).rejects.toMatchObject({
      message: 'id_token_missing',
    });
  });

  it('throws nonce_missing when nonce is empty', async () => {
    const auth = new FakeAuthService();
    const uc = new SignInWithGoogleIdTokenUseCase(auth);

    await expect(uc.execute({ idToken: 't', nonce: '' })).rejects.toBeInstanceOf(AuthError);
  });

  it('propagates auth-service errors verbatim', async () => {
    const auth = new FakeAuthService();
    auth.idTokenError = new AuthError('authentication_failed', 'bad_id_token');
    const uc = new SignInWithGoogleIdTokenUseCase(auth);

    await expect(uc.execute({ idToken: 't', nonce: 'n' })).rejects.toMatchObject({
      code: 'authentication_failed',
    });
  });
});
