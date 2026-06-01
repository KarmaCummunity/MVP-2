import { describe, expect, it, vi } from 'vitest';
import { performFullSignOut } from '../performFullSignOut';

vi.mock('../authComposition', () => ({
  getSignOutUseCase: () => ({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../store/persistedStoresReset', () => ({
  clearAllPersistedStores: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/notifications/register', () => ({
  deactivateCurrentDevice: vi.fn().mockResolvedValue(undefined),
}));

describe('performFullSignOut', () => {
  it('deactivates device, signs out, clears stores, and clears query cache', async () => {
    const signOutLocal = vi.fn();
    const clear = vi.fn();
    const deviceRepo = {} as never;

    await performFullSignOut({
      deviceRepo,
      queryClient: { clear } as never,
      signOutLocal,
    });

    expect(clear).toHaveBeenCalled();
    expect(signOutLocal).toHaveBeenCalled();
  });
});
