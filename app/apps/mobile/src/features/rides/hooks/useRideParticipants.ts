// FR-RIDE-024 — fetches participants for a ride for owner dashboard inline lists.
// Realtime: subscribes to new participant inserts for the ride and refetches.
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RideParticipant, RideParticipantStatus } from '@kc/domain';
import {
  getListRideParticipantsUseCase,
  getRidesRealtime,
} from '../composition/ridesComposition';

export interface UseRideParticipantsResult {
  readonly all: readonly RideParticipant[];
  readonly pending: readonly RideParticipant[];
  readonly approved: readonly RideParticipant[];
  readonly isLoading: boolean;
  readonly refetch: () => Promise<void>;
}

export function useRideParticipants(
  rideId: string | null,
  enabled = true,
): UseRideParticipantsResult {
  const queryClient = useQueryClient();
  const queryKey = ['rides', 'participants', rideId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!rideId) return [] as RideParticipant[];
      return await getListRideParticipantsUseCase().execute({ rideId });
    },
    enabled: Boolean(rideId) && enabled,
    staleTime: 15_000,
  });

  // Realtime: bump the query on new participant inserts so the owner sees
  // pending counts update without manual refresh.
  useEffect(() => {
    if (!rideId || !enabled) return undefined;
    const realtime = getRidesRealtime();
    const unsubscribe = realtime.subscribeToRideParticipantInserts(rideId, {
      onChange: () => {
        void queryClient.invalidateQueries({ queryKey });
      },
    });
    return () => {
      unsubscribe();
    };
    // queryKey is stable per rideId; passing rideId+enabled is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, enabled, queryClient]);

  const all = query.data ?? [];
  const byStatus = useMemo(() => {
    const buckets: Record<RideParticipantStatus, RideParticipant[]> = {
      requested: [],
      approved: [],
      rejected: [],
      cancelled: [],
    };
    for (const p of all) buckets[p.status].push(p);
    return buckets;
  }, [all]);

  return {
    all,
    pending: byStatus.requested,
    approved: byStatus.approved,
    isLoading: query.isLoading,
    refetch: async () => {
      await query.refetch();
    },
  };
}
