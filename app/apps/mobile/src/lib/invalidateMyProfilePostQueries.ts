// Shared invalidation for My Profile post lists (open / hidden / closed / stats counter).
import type { QueryClient } from '@tanstack/react-query';

export function invalidateMyProfilePostQueries(
  queryClient: QueryClient,
  userId: string | undefined,
): void {
  void queryClient.invalidateQueries({ queryKey: ['my-posts'] });
  void queryClient.invalidateQueries({ queryKey: ['my-hidden-open-posts'] });
  void queryClient.invalidateQueries({ queryKey: ['profile-closed-posts'] });
  if (userId) {
    void queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
  }
}
