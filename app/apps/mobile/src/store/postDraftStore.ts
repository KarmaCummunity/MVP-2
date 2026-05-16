// FR-POST-007 — Local draft autosave for the Create Post flow.
// AC1 (write), AC4 (publish/start-fresh/account-deletion clear), AC5 (per-user scope).
// Mirrors lastAddressStore's persist shape (zustand/middleware + AsyncStorage).
// Two-stores split: address keeps a "remember between posts" lifecycle in
// lastAddressStore; the draft body lives here and is cleared on publish.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Category,
  ItemCondition,
  LocationDisplayLevel,
  PostType,
  PostVisibility,
} from '@kc/domain';
import type { UploadedAsset } from '../services/imageUpload';

export interface PostDraftPayload {
  readonly ownerId: string;
  readonly updatedAt: number;
  readonly type: PostType;
  readonly title: string;
  readonly description: string;
  readonly category: Category;
  readonly condition: ItemCondition;
  readonly urgency: string;
  readonly locationDisplayLevel: LocationDisplayLevel;
  readonly visibility: PostVisibility;
  readonly hideFromCounterparty: boolean;
  readonly uploads: readonly UploadedAsset[];
}

interface PostDraftState {
  readonly draft: PostDraftPayload | null;
  setDraft: (next: PostDraftPayload) => void;
  clearDraft: () => void;
}

export const POST_DRAFT_STORAGE_KEY = 'kc-post-draft-v1';

export const usePostDraftStore = create<PostDraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (next) => set({ draft: next }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: POST_DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ draft: s.draft }),
    },
  ),
);

/**
 * AC5 helper: returns the persisted draft only when its ownerId matches `currentOwnerId`.
 * Mismatches (different signed-in user, or no signed-in user) yield `null` and silently
 * clear the persisted draft — defense-in-depth against TD-103-class leaks if the
 * `signOut` clear path is bypassed.
 */
export function readDraftForOwner(currentOwnerId: string | undefined): PostDraftPayload | null {
  const draft = usePostDraftStore.getState().draft;
  if (!draft) return null;
  if (!currentOwnerId || draft.ownerId !== currentOwnerId) {
    usePostDraftStore.getState().clearDraft();
    return null;
  }
  return draft;
}
