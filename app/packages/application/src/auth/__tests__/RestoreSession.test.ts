import { describe, it, expect } from 'vitest';
import { RestoreSessionUseCase } from '../RestoreSession';
import { FakeAuthService, makeSession } from './fakeAuthService';

describe('RestoreSessionUseCase', () => {
  it('returns null when no session is persisted (FR-AUTH-013 AC1)', async () => {
    const auth = new FakeAuthService();
    auth.currentSession = null;
    const uc = new RestoreSessionUseCase(auth);

    const out = await uc.execute();
    expect(out.session).toBeNull();
  });

  it('returns the session when valid', async () => {
    const auth = new FakeAuthService();
    auth.currentSession = makeSession({ expiresAt: Math.floor(Date.now() / 1000) + 600 });
    const uc = new RestoreSessionUseCase(auth);

    const out = await uc.execute();
    expect(out.session).not.toBeNull();
    expect(out.session?.userId).toBe('u_1');
  });

  it('discards an expired session (FR-AUTH-013 AC1: expired routes to splash)', async () => {
    const auth = new FakeAuthService();
    auth.currentSession = makeSession({ expiresAt: Math.floor(Date.now() / 1000) - 10 });
    const uc = new RestoreSessionUseCase(auth);

    const out = await uc.execute();
    expect(out.session).toBeNull();
  });
});
