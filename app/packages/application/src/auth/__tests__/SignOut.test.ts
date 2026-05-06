import { describe, it, expect } from 'vitest';
import { SignOutUseCase } from '../SignOut';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('SignOutUseCase', () => {
  it('delegates to adapter and clears local session', async () => {
    const auth = new FakeAuthService();
    auth.currentSession = makeSession();
    const uc = new SignOutUseCase(auth);

    await uc.execute();

    expect(auth.signOutCalled).toBe(1);
    expect(auth.currentSession).toBeNull();
  });
});
