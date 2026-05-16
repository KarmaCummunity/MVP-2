// FR-POST-007 AC2/AC3/AC5 — on Create Post mount, read the persisted draft for
// the current user, probe its images for availability, and expose a tiny API
// the screen uses to surface the resume banner.
import { useCallback, useEffect, useState } from 'react';
import { readDraftForOwner, usePostDraftStore } from '../store/postDraftStore';
import {
  probeDraftImageAvailability,
  type DraftImage,
  type StorageProbe,
} from '../lib/probeDraftImageAvailability';
import type { PostDraftPayload } from '../store/postDraftStore';

export type HydratedDraft = Omit<PostDraftPayload, 'uploads'> & {
  readonly uploads: readonly DraftImage[];
  readonly missingCount: number;
};

export type DraftHydrationStatus =
  | { readonly phase: 'pending' }
  | { readonly phase: 'none' }
  | { readonly phase: 'ready'; readonly draft: HydratedDraft };

export interface UsePostDraftHydrationApi {
  readonly status: DraftHydrationStatus;
  readonly continueWithDraft: () => HydratedDraft | null;
  readonly startFresh: () => void;
}

export function usePostDraftHydration(
  ownerId: string | undefined,
  probe?: StorageProbe,
): UsePostDraftHydrationApi {
  const [status, setStatus] = useState<DraftHydrationStatus>({ phase: 'pending' });

  useEffect(() => {
    let cancelled = false;
    if (!ownerId) {
      setStatus({ phase: 'none' });
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      const draft = readDraftForOwner(ownerId);
      if (cancelled) return;
      if (!draft) {
        setStatus({ phase: 'none' });
        return;
      }
      const { assets, missingCount } = await probeDraftImageAvailability(
        draft.uploads,
        probe,
      );
      if (cancelled) return;
      setStatus({
        phase: 'ready',
        draft: { ...draft, uploads: assets, missingCount },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, probe]);

  const continueWithDraft = useCallback((): HydratedDraft | null => {
    if (status.phase !== 'ready') return null;
    setStatus({ phase: 'none' });
    return status.draft;
  }, [status]);

  const startFresh = useCallback((): void => {
    usePostDraftStore.getState().clearDraft();
    setStatus({ phase: 'none' });
  }, []);

  return { status, continueWithDraft, startFresh };
}
