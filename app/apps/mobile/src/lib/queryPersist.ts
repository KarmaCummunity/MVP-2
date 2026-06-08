// PERF-6 (Shipment 3): persist the React Query cache to the device so a cold
// start renders the last-seen feed / profile / inbox instantly, then
// revalidates in the background — instead of a blank spinner + a network
// round-trip on every launch.
//
// Privacy / multi-user isolation: only successful queries are persisted, the
// snapshot lives in app-sandboxed AsyncStorage, and it is wiped on sign-out /
// delete-account via `clearPersistedQueryCache` (called from
// `clearAllPersistedStores`). Auth tokens are NOT here — they stay in
// expo-secure-store.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, type Query } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/** AsyncStorage key holding the dehydrated query snapshot. */
export const RQ_CACHE_KEY = 'kc-rq-cache';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// `gcTime` must be >= the persister `maxAge`: a query garbage-collected from
// memory is also dropped from the next persisted snapshot, so a short gcTime
// would silently shrink "everything we already loaded" back to nothing.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60_000,       // 10 min — most data is fine for 10 min
      gcTime: WEEK_MS,              // survive long enough to persist + restore
      refetchOnWindowFocus: false,  // Realtime + per-query overrides handle live data
      refetchOnMount: true,         // respects staleTime → background refresh after restore
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: RQ_CACHE_KEY,
  throttleTime: 1000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: WEEK_MS,
  // Manual schema version: bump ONLY when a cached query's shape changes such
  // that old snapshots can't satisfy it. Deliberately not tied to the app
  // version, so a routine store update keeps the warm cache (the whole point).
  buster: 'kc-rq-v1',
  dehydrateOptions: {
    // Never persist errored or in-flight queries — only resolved data.
    shouldDehydrateQuery: (query: Query) => query.state.status === 'success',
  },
};

/** Wipe the device query snapshot. Call on sign-out / delete-account. */
export async function clearPersistedQueryCache(): Promise<void> {
  await persister.removeClient();
}
