// SupabaseFeedRealtime — adapter for IFeedRealtime.
// Mapped to SRS: FR-FEED-009 ("↑ N new posts" banner, ≤2s freshness at p95).
//
// Subscribes to INSERTs of Public, open posts so the UI can increment its
// new-posts counter without re-fetching the full feed. RLS gates rows on the
// server side, so followers-only posts never reach this channel.
//
// Lifecycle: the store calls subscribe on feed mount and the returned
// unsubscribe on unmount / 60-second background (FR-FEED-009 AC3). Reconnects
// are managed by the realtime client; on resume the store also fires a single
// REST refetch to fill any gap.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FeedRealtimeCallbacks, IFeedRealtime } from '@kc/application';
import type { Database } from '../database.types';

export class SupabaseFeedRealtime implements IFeedRealtime {
  constructor(private readonly client: SupabaseClient<Database>) {}

  subscribeToPublicInserts(cb: FeedRealtimeCallbacks): () => void {
    // Unique topic per call: the realtime client caches channels by topic in
    // `client.channels`. `channel.unsubscribe()` does NOT remove the cache
    // entry synchronously, so a remount (navigation, StrictMode, AppState
    // resume) would otherwise reuse a stale channel with `joinedOnce=true` —
    // and `.on('postgres_changes', ...)` would throw
    // "cannot add postgres_changes callbacks after subscribe()".
    const topic = `posts:public-feed:${Math.random().toString(36).slice(2, 10)}`;

    const channel = this.client
      .channel(topic)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'visibility=eq.Public',
        },
        () => cb.onNewPublicPost(),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          cb.onError?.(new Error(`feed channel ${status.toLowerCase()}`));
        }
      });

    return () => {
      void this.client.removeChannel(channel);
    };
  }
}
