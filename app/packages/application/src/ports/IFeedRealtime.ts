// IFeedRealtime — port for realtime feed freshness (FR-FEED-009).
//
// The application layer subscribes to INSERTs of public, open posts so that
// the UI can show a "↑ N new posts" pill at the top of the feed. The full
// post row is NOT delivered here — the UI refetches the feed query when the
// user taps the pill (avoids client-side visibility/blocking re-checks).
//
// Adapter implementation: SupabaseFeedRealtime (mirrors SupabaseChatRealtime).

export interface FeedRealtimeCallbacks {
  /** Fires once per INSERT event after the realtime channel is SUBSCRIBED. */
  onNewPublicPost: () => void;
  /** Optional error sink. The store decides whether to surface or swallow. */
  onError?: (error: Error) => void;
}

export interface IFeedRealtime {
  /**
   * Subscribe to public-feed INSERTs. Returns an unsubscribe function the
   * caller must invoke on unmount (or when the screen is backgrounded for
   * more than 60s — see FR-FEED-009 AC3).
   */
  subscribeToPublicInserts(cb: FeedRealtimeCallbacks): () => void;
}
