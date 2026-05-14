// Hook for fetching community stats on the About screen.
// Polls every 60 s, matching FR-STATS-004.

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCommunityStatsSnapshotUseCase } from '../services/postsComposition';

interface StatsState {
  readonly users: number;
  readonly posts: number;
  readonly delivered: number;
  readonly loading: boolean;
  readonly error: boolean;
}

const POLL_INTERVAL_MS = 60_000;

export function useCommunityStatsAbout(): StatsState & { refetch: () => void } {
  const [state, setState] = useState<StatsState>({
    users: 0,
    posts: 0,
    delivered: 0,
    loading: true,
    error: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const snap = await getCommunityStatsSnapshotUseCase().execute();
      setState({
        users: snap.registeredUsers,
        posts: snap.activePublicPosts,
        delivered: snap.itemsDeliveredTotal,
        loading: false,
        error: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, []);

  useEffect(() => {
    void fetch();
    timerRef.current = setInterval(() => void fetch(), POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [fetch]);

  return { ...state, refetch: fetch };
}
