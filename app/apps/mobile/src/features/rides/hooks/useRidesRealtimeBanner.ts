// FR-RIDE-023 AC4 — "N new rides — refresh" banner state.
// Subscribes to `IRidesRealtime.subscribeToPublicRideInserts` while the hub is
// focused; increments a counter on each signal; resets when the consumer
// calls `acknowledge()`. Mirrors the feed's new-posts banner pattern.
import { useEffect, useRef, useState } from 'react';
import { getRidesRealtime } from '../composition/ridesComposition';

export interface UseRidesRealtimeBannerResult {
  readonly newCount: number;
  readonly acknowledge: () => void;
}

export function useRidesRealtimeBanner(enabled: boolean): UseRidesRealtimeBannerResult {
  const [newCount, setNewCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const realtime = getRidesRealtime();
    const unsubscribe = realtime.subscribeToPublicRideInserts({
      onChange: () => {
        countRef.current += 1;
        setNewCount(countRef.current);
      },
      onError: () => {
        // Silent — banner is a polish surface, not load-bearing.
      },
    });
    return () => {
      unsubscribe();
    };
  }, [enabled]);

  return {
    newCount,
    acknowledge: () => {
      countRef.current = 0;
      setNewCount(0);
    },
  };
}
