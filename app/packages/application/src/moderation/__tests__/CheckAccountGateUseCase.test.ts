import { describe, it, expect } from 'vitest';
import { CheckAccountGateUseCase } from '../CheckAccountGateUseCase';
import { FakeAccountGateRepository } from './fakeAccountGateRepository';

describe('CheckAccountGateUseCase', () => {
  it('returns repo result and forwards userId', async () => {
    const repo = new FakeAccountGateRepository();
    repo.result = { allowed: false, reason: 'banned', until: '2026-12-31T00:00:00Z' };
    const uc = new CheckAccountGateUseCase(repo);

    const result = await uc.execute({ userId: 'u_1' });

    expect(result).toEqual({
      allowed: false,
      reason: 'banned',
      until: '2026-12-31T00:00:00Z',
    });
    expect(repo.calls).toEqual(['u_1']);
  });
});
