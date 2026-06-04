import { describe, expect, it } from 'vitest';
import { SignInWithAppleUseCase } from '../SignInWithApple';
import { AuthError } from '../errors';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('SignInWithAppleUseCase', () => {
  it('exchanges the Apple credential for a session', async () => {
    const auth = new FakeAuthService();
    auth.appleSignInResult = makeSession();
    const perform = async () => ({ identityToken: 'idtok', rawNonce: 'nonce123' });

    const out = await new SignInWithAppleUseCase(auth, perform).execute();

    expect(out.session).toBe(auth.appleSignInResult);
    expect(auth.lastAppleCredential).toEqual({ identityToken: 'idtok', rawNonce: 'nonce123' });
  });

  it('throws apple_dismissed when the user cancels the sheet', async () => {
    const auth = new FakeAuthService();
    const uc = new SignInWithAppleUseCase(auth, async () => null);

    await expect(uc.execute()).rejects.toBeInstanceOf(AuthError);
    await expect(uc.execute()).rejects.toMatchObject({ message: 'apple_dismissed' });
  });

  it('persists the first-authorization full name for onboarding prefill (AC3)', async () => {
    const auth = new FakeAuthService();
    auth.appleSignInResult = makeSession({ displayName: null });
    const perform = async () => ({ identityToken: 't', rawNonce: 'n', fullName: '  Dana Cohen  ' });

    const out = await new SignInWithAppleUseCase(auth, perform).execute();

    expect(auth.syncProfileCalls).toEqual([{ displayName: 'Dana Cohen' }]);
    expect(out.session.displayName).toBe('Dana Cohen');
  });

  it('does not overwrite an existing display name', async () => {
    const auth = new FakeAuthService();
    auth.appleSignInResult = makeSession({ displayName: 'Existing Name' });
    const perform = async () => ({ identityToken: 't', rawNonce: 'n', fullName: 'Apple Name' });

    const out = await new SignInWithAppleUseCase(auth, perform).execute();

    expect(auth.syncProfileCalls).toEqual([]);
    expect(out.session.displayName).toBe('Existing Name');
  });

  it('does not sync profile metadata when Apple returns no name (re-auth)', async () => {
    const auth = new FakeAuthService();
    auth.appleSignInResult = makeSession({ displayName: null });
    const perform = async () => ({ identityToken: 't', rawNonce: 'n', fullName: null });

    await new SignInWithAppleUseCase(auth, perform).execute();

    expect(auth.syncProfileCalls).toEqual([]);
  });
});
