import type { QueryClient } from '@tanstack/react-query';
import type { IDeviceRepository } from '@kc/application';
import { getSignOutUseCase } from './authComposition';
import { clearAllPersistedStores } from '../store/persistedStoresReset';
import { deactivateCurrentDevice } from '../lib/notifications/register';

export interface PerformFullSignOutDeps {
  readonly deviceRepo: IDeviceRepository;
  readonly queryClient: QueryClient;
  readonly signOutLocal: () => void;
}

/** FR-AUTH-017 — unified teardown: push deactivate, server sign-out, persisted stores, RQ cache. */
export async function performFullSignOut(deps: PerformFullSignOutDeps): Promise<void> {
  try {
    await deactivateCurrentDevice({ deviceRepo: deps.deviceRepo });
  } catch {
    /* best-effort — never block local sign-out */
  }
  await getSignOutUseCase().execute();
  await clearAllPersistedStores();
  deps.queryClient.clear();
  deps.signOutLocal();
}
