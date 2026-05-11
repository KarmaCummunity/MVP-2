// useFirstPostNudge — eligibility + dismiss handlers for the first-post nudge.
// Mapped to FR-FEED-015 (three-tier dismiss: primary CTA, session, permanent).

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getDismissFirstPostNudgeUseCase,
  getPostRepo,
} from '../services/postsComposition';
import { getUserRepo } from '../services/userComposition';
import { useFeedSessionStore } from '../store/feedSessionStore';

interface UseFirstPostNudgeResult {
  show: boolean;
  dismissForSession: () => void;
  dismissForever: () => Promise<void>;
}

export function useFirstPostNudge(viewerId: string | null): UseFirstPostNudgeResult {
  const sessionDismissed = useFeedSessionStore((s) => s.firstPostNudgeDismissedThisSession);
  const dismissForSession = useFeedSessionStore((s) => s.dismissNudgeForSession);

  const userQuery = useQuery({
    queryKey: ['user', viewerId, 'nudge'],
    queryFn: () => (viewerId ? getUserRepo().findById(viewerId) : null),
    enabled: viewerId !== null,
  });

  const openPostsCountQuery = useQuery({
    queryKey: ['openPostsCount', viewerId, 'nudge'],
    queryFn: () => (viewerId ? getPostRepo().countOpenByUser(viewerId) : 0),
    enabled: viewerId !== null,
  });

  const show = Boolean(
    viewerId &&
      userQuery.data &&
      !userQuery.data.firstPostNudgeDismissed &&
      !sessionDismissed &&
      openPostsCountQuery.data === 0,
  );

  const dismissForever = useCallback(async () => {
    if (!viewerId) return;
    try {
      await getDismissFirstPostNudgeUseCase().execute(viewerId);
      await userQuery.refetch();
    } catch {
      // Fall back to session dismissal so the nudge at least disappears now.
      dismissForSession();
    }
  }, [viewerId, userQuery, dismissForSession]);

  return { show, dismissForSession, dismissForever };
}
