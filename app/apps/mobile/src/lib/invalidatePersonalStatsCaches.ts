// FR-STATS-001 AC2 — keep profile counters + activity timeline fresh after mutating flows.
import type { QueryClient } from '@tanstack/react-query';

export function invalidatePersonalStatsCaches(
  queryClient: QueryClient,
  userId: string | null | undefined,
): void {
  if (!userId) return;
  void queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
  void queryClient.invalidateQueries({ queryKey: ['my-activity-timeline', userId] });
}
