import { describe, it, expect } from 'vitest';
import { VerifyEmailUseCase } from '../VerifyEmail';
import { AuthError } from '../errors';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('VerifyEmailUseCase', () => {
  it('passes the token hash to the adapter and returns the session', async () => {
    const auth = new FakeAuthService();
    auth.verifyEmailResult = makeSession();
    const uc = new VerifyEmailUseCase(auth);

    const out = await uc.execute({ tokenHash: 'abc123' });

    expect(auth.verifyEmailCalls).toEqual(['abc123']);
    expect(out.session.userId).toBe('u_1');
  });

  it('rejects empty token before hitting the adapter', async () => {
    const auth = new FakeAuthService();
    const uc = new VerifyEmailUseCase(auth);

    await expect(uc.execute({ tokenHash: '' })).rejects.toMatchObject({
      code: 'unknown',
    } satisfies Partial<AuthError>);
    expect(auth.verifyEmailCalls).toHaveLength(0);
  });
});
