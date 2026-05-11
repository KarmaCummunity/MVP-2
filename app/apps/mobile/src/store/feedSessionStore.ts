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
  /** Short-lived toast (publish success / failure) — FR-POST publish UX. */
  ephemeralToast: { message: string; tone: 'success' | 'error' } | null;

  incrementNewPosts: () => void;
  resetNewPosts: () => void;
  dismissNudgeForSession: () => void;
  showEphemeralToast: (message: string, tone: 'success' | 'error', durationMs?: number) => void;
}

let ephemeralToastTimer: ReturnType<typeof setTimeout> | null = null;

export const useFeedSessionStore = create<FeedSessionState>((set) => ({
  newPostsCount: 0,
  firstPostNudgeDismissedThisSession: false,
  ephemeralToast: null,

  incrementNewPosts: () => set((s) => ({ newPostsCount: s.newPostsCount + 1 })),
  resetNewPosts: () => set({ newPostsCount: 0 }),
  dismissNudgeForSession: () => set({ firstPostNudgeDismissedThisSession: true }),
  showEphemeralToast: (message, tone, durationMs = 1500) => {
    if (ephemeralToastTimer) {
      clearTimeout(ephemeralToastTimer);
      ephemeralToastTimer = null;
    }
    set({ ephemeralToast: { message, tone } });
    ephemeralToastTimer = setTimeout(() => {
      set({ ephemeralToast: null });
      ephemeralToastTimer = null;
    }, durationMs);
  },
}));
