// FR-FEED-014 — shared active-posts counter used by the guest banner (FR-AUTH-014 AC3)
// and any other surface that needs the community-size hint.
import { useQuery } from '@tanstack/react-query';
import { getActivePostsCountUseCase } from '../services/postsComposition';

export function useActivePostsCount(): number | undefined {
  const { data } = useQuery({
    queryKey: ['communityActivePostsCount'],
    queryFn: () => getActivePostsCountUseCase().execute(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  return typeof data === 'number' ? data : undefined;
}
