// FR-RIDE-034 — active ride data + snapshot membership check.
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RideListingRow } from '@kc/application';
import type { RideEmergencyEvent } from '@kc/domain';
import { useAuthStore } from '../../../store/authStore';
import {
  getListRideEmergencyEventsUseCase,
  getListRideParticipantsUseCase,
  getRideListingUseCase,
  getRidesRealtime,
} from '../composition/ridesComposition';

export interface UseActiveRideResult {
  readonly ride: RideListingRow | undefined;
  readonly emergencies: readonly RideEmergencyEvent[];
  readonly isOwner: boolean;
  readonly isSnapshotParticipant: boolean;
  readonly elapsedSinceStartMs: number | null;
  readonly isLoading: boolean;
  readonly refetch: () => Promise<void>;
}

export function useActiveRide(rideId: string | null): UseActiveRideResult {
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  const queryClient = useQueryClient();

  const rideQuery = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () =>
      rideId ? getRideListingUseCase().execute({ rideId, viewerId: viewerId ?? '' }) : null,
    enabled: Boolean(rideId),
    staleTime: 5_000,
    // Pulls every 30s while active so the elapsed counter + status stay fresh.
    refetchInterval: 30_000,
  });

  const participantsQuery = useQuery({
    queryKey: ['rides', 'participants', rideId],
    queryFn: () =>
      rideId ? getListRideParticipantsUseCase().execute({ rideId }) : Promise.resolve([]),
    enabled: Boolean(rideId),
    staleTime: 15_000,
  });

  const emergenciesQuery = useQuery({
    queryKey: ['rides', 'emergencies', rideId],
    queryFn: () =>
      rideId ? getListRideEmergencyEventsUseCase().execute(rideId) : Promise.resolve([]),
    enabled: Boolean(rideId),
    staleTime: 30_000,
  });

  // Realtime: when a participant row changes (most likely the participant snapshot
  // got cancelled or new ride status pushed via FR-RIDE-019), invalidate.
  useEffect(() => {
    if (!viewerId) return undefined;
    const realtime = getRidesRealtime();
    const unsubscribe = realtime.subscribeToUserParticipantUpdates(viewerId, {
      onChange: () => {
        void queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] });
        void queryClient.invalidateQueries({ queryKey: ['rides', 'participants', rideId] });
      },
    });
    return () => {
      unsubscribe();
    };
  }, [viewerId, rideId, queryClient]);

  const ride = rideQuery.data ?? undefined;
  const isOwner = Boolean(ride && viewerId && ride.ownerId === viewerId);

  const isSnapshotParticipant = useMemo(() => {
    if (!ride || !viewerId) return false;
    if (isOwner) return true; // Owner is always part of the trip.
    // The RPC sets joined_active_at on approved riders when the ride starts;
    // membership for the emergency surface = my own row has joined_active_at.
    const rows = participantsQuery.data ?? [];
    const mine = rows.find((r) => r.userId === viewerId);
    return Boolean(mine && mine.status === 'approved');
  }, [ride, viewerId, isOwner, participantsQuery.data]);

  const elapsedSinceStartMs = useMemo(() => {
    if (!ride?.startedAt) return null;
    return Date.now() - new Date(ride.startedAt).getTime();
  }, [ride?.startedAt]);

  return {
    ride,
    emergencies: emergenciesQuery.data ?? [],
    isOwner,
    isSnapshotParticipant,
    elapsedSinceStartMs,
    isLoading: rideQuery.isLoading,
    refetch: async () => {
      await Promise.all([rideQuery.refetch(), participantsQuery.refetch(), emergenciesQuery.refetch()]);
    },
  };
}
