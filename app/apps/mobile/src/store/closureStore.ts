// ─────────────────────────────────────────────
// FR-CLOSURE-001..005 — composition root for the closure flow.
// Holds: which post is currently being closed, current step,
// recipient candidates. Actions delegate to use cases.
// ─────────────────────────────────────────────

import { create } from 'zustand';
import type { ClosureCandidate } from '@kc/application';
import type { PostType } from '@kc/domain';
import {
  getGetClosureCandidatesUseCase,
  getMarkAsDeliveredUseCase,
} from '../services/postsComposition';
import {
  getDismissClosureExplainerUseCase,
  getSearchUsersForClosureUseCase,
} from '../services/userComposition';

export type ClosureStep = 'idle' | 'confirm' | 'pick' | 'explainer' | 'done' | 'error';
export type PickMode = 'chats' | 'search';

interface ClosureState {
  postId: string | null;
  /** Drives Hebrew copy in every step — Give vs Request flips the directional
   *  language ("מסרת ל" vs "קיבלת מ") and the Step-1 question. */
  postType: PostType | null;
  step: ClosureStep;
  pickMode: PickMode;
  /** Chat partners (loaded once on start). */
  candidates: ClosureCandidate[];
  /** Search results (refreshed per query). */
  searchResults: ClosureCandidate[];
  searchQuery: string;
  isSearching: boolean;
  selectedRecipientId: string | null;
  errorMessage: string | null;
  isBusy: boolean;
}

interface ClosureActions {
  start(
    postId: string,
    ownerId: string,
    postType: PostType,
    options?: { preselectedRecipientId?: string | null }
  ): Promise<void>;
  selectRecipient(userId: string | null): void;
  setPickMode(mode: PickMode): void;
  setSearchQuery(query: string, ownerId: string): void;
  confirmStep1(): void;
  closeWith(recipientUserId: string | null, ownerId: string): Promise<void>;
  dismissExplainer(stayDismissed: boolean, userId: string): Promise<void>;
  /** Skip the explainer step and signal success — used when the user has already
   *  ticked "אל תציג שוב". Sets step='done' so subscribers (OwnerActionsBar)
   *  can react and refetch their data. */
  completeWithoutExplainer(): void;
  reset(): void;
}

const INITIAL: ClosureState = {
  postId: null,
  postType: null,
  step: 'idle',
  pickMode: 'chats',
  candidates: [],
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  selectedRecipientId: null,
  errorMessage: null,
  isBusy: false,
};

// Per-store debounce timer for search. Module-scoped because Zustand actions
// don't expose a closure-friendly place to keep one.
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useClosureStore = create<ClosureState & ClosureActions>((set, get) => ({
  ...INITIAL,

  async start(postId, ownerId, postType, options) {
    const preselect = options?.preselectedRecipientId ?? null;
    // When the entry-point already knows the recipient (e.g. the chat anchored
    // to this post), pre-select them AND jump straight to the picker step so
    // the user confirms with a single tap. They can still pick a different
    // recipient from the chat list, or hit "סגור בלי לסמן" to take the no-
    // recipient branch.
    set({
      ...INITIAL,
      postId,
      postType,
      step: preselect ? 'pick' : 'confirm',
      selectedRecipientId: preselect,
      isBusy: true,
    });
    try {
      const candidates = await getGetClosureCandidatesUseCase().execute({ postId, ownerId });
      set({ candidates, isBusy: false });
    } catch (e) {
      set({ step: 'error', isBusy: false, errorMessage: (e as Error).message });
    }
  },

  selectRecipient(userId) {
    set({ selectedRecipientId: userId });
  },

  setPickMode(mode) {
    // Clearing the selection on switch prevents accidentally submitting the
    // wrong recipient when the user toggles back and forth.
    set({ pickMode: mode, selectedRecipientId: null, searchQuery: '', searchResults: [] });
  },

  setSearchQuery(query, ownerId) {
    set({ searchQuery: query });
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    if (query.trim().length < 2) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    searchDebounceTimer = setTimeout(async () => {
      try {
        const results = await getSearchUsersForClosureUseCase().execute({
          query,
          ownerId,
        });
        if (get().searchQuery === query) {
          // Only commit if the query hasn't moved on.
          set({ searchResults: results, isSearching: false });
        }
      } catch {
        if (get().searchQuery === query) set({ searchResults: [], isSearching: false });
      }
    }, 300);
  },

  confirmStep1() {
    set({ step: 'pick' });
  },

  async closeWith(recipientUserId, ownerId) {
    const postId = get().postId;
    if (!postId) return;
    set({ isBusy: true, errorMessage: null });
    try {
      await getMarkAsDeliveredUseCase().execute({ postId, ownerId, recipientUserId });
      set({ step: 'explainer', isBusy: false });
    } catch (e) {
      set({ step: 'error', isBusy: false, errorMessage: (e as Error).message });
    }
  },

  async dismissExplainer(stayDismissed, userId) {
    if (stayDismissed) {
      try {
        await getDismissClosureExplainerUseCase().execute({ userId });
      } catch {
        // Non-blocking — closure already succeeded; the flag flip is best-effort.
      }
    }
    set({ step: 'done' });
  },

  completeWithoutExplainer() {
    set({ step: 'done' });
  },

  reset() {
    set(INITIAL);
  },
}));
