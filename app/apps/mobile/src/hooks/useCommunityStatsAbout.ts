// Hook for fetching community stats on the About screen.
// Fetches once on mount, then stays fresh via Supabase Realtime — no polling.
// Mapped to FR-STATS-004.

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { getCommunityStatsSnapshotUseCase } from '../services/postsComposition';

interface StatsState {
  readonly users: number;
  readonly posts: number;
  readonly delivered: number;
  readonly loading: boolean;
  readonly error: boolean;
}

export function useCommunityStatsAbout(): StatsState & { refetch: () => void } {
  const [state, setState] = useState<StatsState>({
    users: 0,
    posts: 0,
    delivered: 0,
    loading: true,
    error: false,
  });

  const fetchOnce = useCallback(async (guard: { cancelled: boolean }) => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const snap = await getCommunityStatsSnapshotUseCase().execute();
      if (guard.cancelled) return;
      setState({
        users: snap.registeredUsers,
        posts: snap.activePublicPosts,
        delivered: snap.itemsDeliveredTotal,
        loading: false,
        error: false,
      });
    } catch {
      if (guard.cancelled) return;
      setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, []);

  useEffect(() => {
    const guard = { cancelled: false };
    void fetchOnce(guard);

    const supabase = getSupabaseClient();
    // Unique topic per mount: the client caches channels by topic. After
    // unsubscribe/removeChannel the cache entry can linger, so a remount
    // (navigation, StrictMode) would reuse a joined channel and `.on()` throws.
    const topic = `community-stats-watch:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_stats' },
        () => void fetchOnce(guard),
      )
      .subscribe();

    return () => {
      guard.cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [fetchOnce]);

  const refetch = useCallback(() => {
    const guard = { cancelled: false };
    void fetchOnce(guard);
  }, [fetchOnce]);

  return { ...state, refetch };
}
