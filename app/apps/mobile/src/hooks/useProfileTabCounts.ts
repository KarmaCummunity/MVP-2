// FR-PROFILE-001 AC4 — open/closed tab badge counts on profile screens.
import { useQuery } from '@tanstack/react-query';
import { getPostRepo } from '../services/postsComposition';

export function useProfileTabCounts({
  profileUserId,
  viewerUserId,
  enabled = true,
}: {
  profileUserId: string | undefined;
  viewerUserId: string | null;
  enabled?: boolean;
}) {
  const isSelf =
    Boolean(profileUserId) &&
    Boolean(viewerUserId) &&
    profileUserId === viewerUserId;

  const openQuery = useQuery({
    queryKey: ['profile-tab-open-count', profileUserId, viewerUserId],
    queryFn: () =>
      getPostRepo().countProfileOpenPosts(profileUserId!, {
        excludeOnlyMe: isSelf,
      }),
    enabled: Boolean(profileUserId) && enabled,
  });

  const closedQuery = useQuery({
    queryKey: ['profile-tab-closed-count', profileUserId, viewerUserId],
    queryFn: () =>
      getPostRepo().countProfileClosedPosts(profileUserId!, viewerUserId),
    enabled: Boolean(profileUserId) && enabled,
  });

  const openCount = openQuery.data;
  const closedCount = closedQuery.data;
  const totalCount =
    openCount !== undefined && closedCount !== undefined
      ? openCount + closedCount
      : undefined;

  return {
    openCount,
    closedCount,
    /** FR-PROFILE-013 — headline "פוסטים" = open tab + closed tab (same sources as badges). */
    totalCount,
    isLoading: openQuery.isLoading || closedQuery.isLoading,
  };
}
