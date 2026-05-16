// Wraps `GetProfileClosedPostsUseCase` in `useInfiniteQuery` so both the My-Profile
// "closed" tab and the Other-Profile screen share the same paging shape.
// Mapped to: FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised), TD-153.
import { useInfiniteQuery } from '@tanstack/react-query';
import { getProfileClosedPostsUseCase } from '../services/postsComposition';

const PAGE_SIZE = 30;

export interface UseProfileClosedPostsArgs {
  profileUserId: string | undefined;
  viewerUserId: string | null;
  enabled?: boolean;
}

export function useProfileClosedPosts({
  profileUserId,
  viewerUserId,
  enabled = true,
}: UseProfileClosedPostsArgs) {
  const query = useInfiniteQuery({
    queryKey: ['profile-closed-posts', profileUserId, viewerUserId],
    queryFn: ({ pageParam }) =>
      getProfileClosedPostsUseCase().execute({
        profileUserId: profileUserId!,
        viewerUserId,
        limit: PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(profileUserId) && enabled,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    items,
    isLoading: query.isLoading,
    hasMore: Boolean(query.hasNextPage),
    isLoadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
  };
}
