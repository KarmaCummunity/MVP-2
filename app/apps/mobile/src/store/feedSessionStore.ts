import { create } from 'zustand';

// In-memory store for feed-screen ephemeral state. Not persisted — refreshed
// each cold start. Lives alongside `filterStore` (persisted) so the two
// concerns stay separate.
//
// Mapped to: FR-FEED-009 (newPostsCount banner), FR-FEED-015 (soft session
// dismissal of the first-post nudge).

interface FeedSessionState {
  /** New public posts that arrived via realtime since the user last refetched. */
  newPostsCount: number;
  /** Soft (session-only) dismissal of the first-post nudge. */
  firstPostNudgeDismissedThisSession: boolean;

  incrementNewPosts: () => void;
  resetNewPosts: () => void;
  dismissNudgeForSession: () => void;
}

export const useFeedSessionStore = create<FeedSessionState>((set) => ({
  newPostsCount: 0,
  firstPostNudgeDismissedThisSession: false,

  incrementNewPosts: () => set((s) => ({ newPostsCount: s.newPostsCount + 1 })),
  resetNewPosts: () => set({ newPostsCount: 0 }),
  dismissNudgeForSession: () => set({ firstPostNudgeDismissedThisSession: true }),
}));
