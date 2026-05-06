import { describe, it, expect } from 'vitest';
import { SignInWithEmailUseCase } from '../SignInWithEmail';
import { AuthError } from '../errors';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('SignInWithEmailUseCase', () => {
  it('returns session on success and lowercases email', async () => {
    const auth = new FakeAuthService();
    auth.signInResult = makeSession();
    const uc = new SignInWithEmailUseCase(auth);

    const out = await uc.execute({ email: ' Foo@Bar.IO ', password: 'whatever' });
    expect(out.session.userId).toBe('u_1');
  });

  it('rejects malformed email before calling adapter', async () => {
    const auth = new FakeAuthService();
    const uc = new SignInWithEmailUseCase(auth);
    await expect(
      uc.execute({ email: 'invalid', password: 'x' }),
    ).rejects.toMatchObject({ code: 'invalid_email' });
  });

  it('rejects empty password', async () => {
    const auth = new FakeAuthService();
    const uc = new SignInWithEmailUseCase(auth);
    await expect(
      uc.execute({ email: 'a@b.co', password: '' }),
    ).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('propagates adapter AuthError', async () => {
    const auth = new FakeAuthService();
    auth.signInError = new AuthError('invalid_credentials', 'bad creds');
    const uc = new SignInWithEmailUseCase(auth);
    await expect(
      uc.execute({ email: 'a@b.co', password: 'whatever' }),
    ).rejects.toMatchObject({ code: 'invalid_credentials' });
  });
});
