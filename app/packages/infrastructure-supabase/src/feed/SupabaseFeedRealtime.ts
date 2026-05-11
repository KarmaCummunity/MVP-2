// SupabaseFeedRealtime — adapter for IFeedRealtime.
// Mapped to SRS: FR-FEED-009 ("↑ N new posts" banner, ≤2s freshness at p95).
//
// Subscribes to INSERTs of Public, open posts so the UI can increment its
// new-posts counter without re-fetching the full feed. RLS gates rows on the
// server side, so followers-only / blocked posts never reach this channel.
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
    const channel = this.client
      .channel('posts:public-feed')
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
      void channel.unsubscribe();
    };
  }
}
