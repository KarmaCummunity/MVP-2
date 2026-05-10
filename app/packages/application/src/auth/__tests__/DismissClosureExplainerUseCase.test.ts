import { describe, it, expect } from 'vitest';
import { DismissClosureExplainerUseCase } from '../DismissClosureExplainerUseCase';
import { makeFakeUserRepo } from './fakeUserRepository';

describe('DismissClosureExplainerUseCase', () => {
  it('flips the dismissed flag on the user row', async () => {
    const repo = makeFakeUserRepo({
      u_1: {
        displayName: 'X',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'completed',
      },
    });
    const uc = new DismissClosureExplainerUseCase(repo);

    await uc.execute({ userId: 'u_1' });

    expect(repo.rows.get('u_1')?.closureExplainerDismissed).toBe(true);
  });

  it('is idempotent — calling twice leaves the flag true', async () => {
    const repo = makeFakeUserRepo({
      u_1: {
        displayName: 'X',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'completed',
      },
    });
    const uc = new DismissClosureExplainerUseCase(repo);

    await uc.execute({ userId: 'u_1' });
    await uc.execute({ userId: 'u_1' });

    expect(repo.rows.get('u_1')?.closureExplainerDismissed).toBe(true);
  });

  it('handles a user with no prior row by creating one', async () => {
    const repo = makeFakeUserRepo();
    const uc = new DismissClosureExplainerUseCase(repo);

    await uc.execute({ userId: 'u_new' });

    expect(repo.rows.get('u_new')?.closureExplainerDismissed).toBe(true);
  });
});
