// FR-KARMA-009 — push karma_points + all per-user counters live by patching the
// shared ['user-profile', userId] query cache from the self-row subscription.
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getUserRealtime } from '../services/userRealtimeComposition';

export function useMeRealtime(): void {
  const userId = useAuthStore((s) => s.session?.userId);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const unsub = getUserRealtime().subscribeToSelf(
      userId,
      (user) => queryClient.setQueryData(['user-profile', userId], user),
      (err) => { if (__DEV__) console.warn('[karma] self-realtime channel error:', err.message); },
    );
    return unsub;
  }, [userId, queryClient]);
}
