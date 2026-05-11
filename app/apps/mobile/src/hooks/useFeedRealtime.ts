// useFeedRealtime — manages the IFeedRealtime subscription lifecycle for the
// Home Feed. Subscribes on mount; unsubscribes after the app has been in the
// background for >60s; re-subscribes (and refetches) on resume.
//
// Mapped to FR-FEED-009.

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getFeedRealtime } from '../services/postsComposition';
import { useFeedSessionStore } from '../store/feedSessionStore';

const BACKGROUND_DISCONNECT_MS = 60_000;

export function useFeedRealtime(onResume: () => void): void {
  const incrementNewPosts = useFeedSessionStore((s) => s.incrementNewPosts);

  useEffect(() => {
    const realtime = getFeedRealtime();
    let unsubscribe = realtime.subscribeToPublicInserts({
      onNewPublicPost: () => incrementNewPosts(),
    });

    let backgroundTimer: ReturnType<typeof setTimeout> | null = null;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        if (!backgroundTimer) {
          backgroundTimer = setTimeout(() => {
            unsubscribe();
            unsubscribe = () => {};
          }, BACKGROUND_DISCONNECT_MS);
        }
      } else {
        if (backgroundTimer) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
        }
        // Resubscribe in case the disconnect fired while in the background.
        unsubscribe = realtime.subscribeToPublicInserts({
          onNewPublicPost: () => incrementNewPosts(),
        });
        onResume();
      }
    });

    return () => {
      if (backgroundTimer) clearTimeout(backgroundTimer);
      sub.remove();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incrementNewPosts]);
}
