import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RideMode } from '@kc/domain';
import { useAuthStore } from '../../../store/authStore';
import { getUserRepo } from '../../../services/userComposition';
import { getRideLastMode } from '../lib/rideLastModeStorage';

export function useRideDefaults() {
  const userId = useAuthStore((s) => s.session?.userId);
  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
  });

  const [mode, setMode] = useState<RideMode>('offer');
  const [modeReady, setModeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getRideLastMode().then((m) => {
      if (!cancelled) {
        setMode(m);
        setModeReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const originCity = useMemo(() => {
    const u = userQuery.data;
    if (!u?.city || !u.cityName) return null;
    return { id: u.city, name: u.cityName };
  }, [userQuery.data]);

  return {
    mode,
    setMode,
    originCity,
    departsAt: new Date(),
    seatsAvailable: 3,
    isLoading: userQuery.isLoading || !modeReady,
  };
}
