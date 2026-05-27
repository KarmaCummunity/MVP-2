// useFeedRealtime — manages the IFeedRealtime subscription lifecycle for the
// Home Feed. Subscribes on mount; unsubscribes after the app has been in the
// background for >60s; on resume does an incremental gap-fill (posts newer
// than `lastSeenAtRef`) instead of a full refetch.
//
// Mapped to FR-FEED-009.

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import type { PostFeedFilter, FeedPage } from '@kc/application';
import { getFeedRealtime, getFeedUseCase } from '../services/postsComposition';
import { useFeedSessionStore } from '../store/feedSessionStore';

const BACKGROUND_DISCONNECT_MS = 60_000;
const GAP_FILL_LIMIT = 50;

export interface UseFeedRealtimeOptions {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  viewerId: string | null;
  feedFilter: PostFeedFilter;
}

export function useFeedRealtime(opts: UseFeedRealtimeOptions): void {
  const { queryClient, queryKey, viewerId, feedFilter } = opts;
  const incrementNewPosts = useFeedSessionStore((s) => s.incrementNewPosts);

  // Track the createdAt of the most recent post we have seen — updated by the
  // caller via current query data on every render (see useEffect below).
  const lastSeenAtRef = useRef<string | null>(null);

  // Mirror query-cache data into lastSeenAtRef so we always know the newest
  // post's timestamp without storing the full data in state.
  useEffect(() => {
    const cached = queryClient.getQueryData<FeedPage>(queryKey);
    const first = cached?.posts[0]?.createdAt ?? null;
    if (first && (!lastSeenAtRef.current || first > lastSeenAtRef.current)) {
      lastSeenAtRef.current = first;
    }
  });

  useEffect(() => {
    const realtime = getFeedRealtime();

    let unsubscribe: (() => void) | null = realtime.subscribeToPublicInserts({
      onNewPublicPost: () => {
        // Record the wall-clock time of the last realtime signal so gap-fill
        // can use it as a lower bound when the subscription was torn down.
        lastSeenAtRef.current = lastSeenAtRef.current ?? new Date().toISOString();
        incrementNewPosts();
      },
    });

    let backgroundTimer: ReturnType<typeof setTimeout> | null = null;

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        // Start the 60s disconnect timer only if we currently have a live
        // subscription and no timer is already pending.
        if (!backgroundTimer && unsubscribe) {
          backgroundTimer = setTimeout(() => {
            unsubscribe?.();
            unsubscribe = null;
          }, BACKGROUND_DISCONNECT_MS);
        }
      } else {
        if (backgroundTimer) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
        }
        // Only resubscribe + gap-fill if the 60s timer actually tore us down.
        if (!unsubscribe) {
          unsubscribe = realtime.subscribeToPublicInserts({
            onNewPublicPost: () => {
              lastSeenAtRef.current = lastSeenAtRef.current ?? new Date().toISOString();
              incrementNewPosts();
            },
          });
          void performGapFill({
            queryClient,
            queryKey,
            viewerId,
            feedFilter,
            lastSeenAt: lastSeenAtRef.current,
          });
        }
      }
    });

    return () => {
      if (backgroundTimer) clearTimeout(backgroundTimer);
      sub.remove();
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incrementNewPosts, queryClient, queryKey, viewerId, feedFilter]);
}

interface GapFillParams {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  viewerId: string | null;
  feedFilter: PostFeedFilter;
  lastSeenAt: string | null;
}

async function performGapFill(params: GapFillParams): Promise<void> {
  const { queryClient, queryKey, viewerId, feedFilter, lastSeenAt } = params;

  // Cold case: no prior data — nothing to prepend; the existing query handles it.
  if (!lastSeenAt) return;

  const page = await getFeedUseCase().execute({
    viewerId,
    filter: feedFilter,
    limit: GAP_FILL_LIMIT,
  });

  const newPosts = page.posts.filter((p) => p.createdAt > lastSeenAt);
  if (newPosts.length === 0) return;

  queryClient.setQueryData<FeedPage>(queryKey, (prev) => {
    if (!prev) return prev;

    // Dedupe: remove from existing list any id already in the incoming batch.
    const incomingIds = new Set(newPosts.map((p) => p.postId));
    const deduped = prev.posts.filter((p) => !incomingIds.has(p.postId));

    return { ...prev, posts: [...newPosts, ...deduped] };
  });
}
