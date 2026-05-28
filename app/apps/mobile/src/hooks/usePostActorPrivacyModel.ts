// FR-POST-003, FR-POST-009, FR-POST-021 — shared state for post exposure / actor privacy (open visibility + closed surface).
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PostVisibility } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import { isPostError } from '@kc/application';
import {
  getListPostActorIdentityUseCase,
  getUpdatePostUseCase,
  getUpsertPostActorIdentityUseCase,
} from '../services/postsComposition';
import { getUserRepo } from '../services/userComposition';
import { useFeedSessionStore } from '../store/feedSessionStore';
import { mapPostErrorToHebrew } from '../services/postMessages';

function inferredClosedSurface(post: PostWithOwner, viewerId: string): PostVisibility {
  if (post.ownerId === viewerId) return post.visibility;
  return 'Public';
}

export function shouldShowPostExposureControls(viewerId: string | null, post: PostWithOwner): boolean {
  if (viewerId == null) return false;
  const isOwner = post.ownerId === viewerId;
  const isRecipientMarked = post.recipient?.recipientUserId === viewerId;
  return isOwner || (post.status === 'closed_delivered' && isRecipientMarked);
}

export interface PostActorPrivacyModel {
  readonly profilePrivacy: 'Public' | 'Private';
  readonly audienceValue: PostVisibility;
  readonly hide: boolean;
  readonly saving: boolean;
  readonly showCounterpartyRow: boolean;
  readonly isOpenOwner: boolean;
  onAudienceChange: (next: PostVisibility) => void;
  onHideChange: (next: boolean) => void;
}

export function usePostActorPrivacyModel(
  post: PostWithOwner,
  viewerId: string,
): PostActorPrivacyModel {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isOwner = post.ownerId === viewerId;
  const isOpenOwner = post.status === 'open' && isOwner;

  const userQuery = useQuery({
    queryKey: ['user-profile', viewerId],
    queryFn: () => getUserRepo().findById(viewerId),
    enabled: Boolean(viewerId),
    staleTime: 5 * 60_000, // PERF-3: profile (self) — edit-profile invalidates explicitly
  });
  const profilePrivacy = userQuery.data?.privacyMode ?? 'Public';

  const identityQuery = useQuery({
    queryKey: ['post-actor-identity', post.postId],
    queryFn: () => getListPostActorIdentityUseCase().execute({ postId: post.postId }),
    staleTime: 5 * 60_000, // PERF-3: post actor identity (self) — upsert mutations invalidate explicitly
  });

  const myRow = identityQuery.data?.find((r) => r.userId === viewerId);
  const [hide, setHide] = useState(myRow?.hideFromCounterparty ?? false);
  const defaultSurface =
    post.status === 'closed_delivered' ? inferredClosedSurface(post, viewerId) : post.visibility;
  const [surface, setSurface] = useState<PostVisibility>(myRow?.surfaceVisibility ?? defaultSurface);

  useEffect(() => {
    setHide(myRow?.hideFromCounterparty ?? false);
    setSurface(myRow?.surfaceVisibility ?? defaultSurface);
  }, [myRow?.hideFromCounterparty, myRow?.surfaceVisibility, defaultSurface]);

  const audienceValue = isOpenOwner ? post.visibility : surface;

  const invalidateAfterPrivacyChange = async () => {
    await qc.invalidateQueries({ queryKey: ['post-actor-identity', post.postId] });
    await qc.invalidateQueries({ queryKey: ['post', post.postId] });
    await qc.invalidateQueries({ queryKey: ['profile-closed-posts'] });
    await qc.invalidateQueries({ queryKey: ['profile-tab-open-count'] });
    await qc.invalidateQueries({ queryKey: ['profile-tab-closed-count'] });
    await qc.invalidateQueries({ queryKey: ['my-hidden-open-posts'] });
    await qc.invalidateQueries({ queryKey: ['feed'] });
    await qc.invalidateQueries({ queryKey: ['my-posts'] });
  };

  const toastErr = (err: unknown) => {
    const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : t('post.networkError');
    useFeedSessionStore.getState().showEphemeralToast(t('post.publishFailed', { message }), 'error');
  };

  const updatePostVisibility = useMutation({
    mutationFn: (next: PostVisibility) =>
      getUpdatePostUseCase().execute({
        postId: post.postId,
        viewerId,
        patch: { visibility: next },
      }),
    onSuccess: async () => {
      await invalidateAfterPrivacyChange();
    },
    onError: toastErr,
  });

  const upsertIdentity = useMutation({
    mutationFn: (input: { surfaceVisibility: PostVisibility; hideFromCounterparty: boolean }) =>
      getUpsertPostActorIdentityUseCase().execute({
        postId: post.postId,
        userId: viewerId,
        surfaceVisibility: input.surfaceVisibility,
        hideFromCounterparty: input.hideFromCounterparty,
      }),
    onSuccess: async () => {
      await invalidateAfterPrivacyChange();
    },
    onError: toastErr,
  });

  const saving = updatePostVisibility.isPending || upsertIdentity.isPending;

  // FR-POST-021 AC7 — mask preference is editable on open posts (pre-close) and on closed posts.
  const showCounterpartyRow =
    isOwner || (post.status === 'closed_delivered' && post.recipient?.recipientUserId === viewerId);

  const persistIdentity = (next: {
    surfaceVisibility: PostVisibility;
    hideFromCounterparty: boolean;
  }) => {
    setSurface(next.surfaceVisibility);
    setHide(next.hideFromCounterparty);
    upsertIdentity.mutate(next);
  };

  const persistClosed = (next: { surfaceVisibility?: PostVisibility; hideFromCounterparty?: boolean }) => {
    const sv = next.surfaceVisibility ?? surface;
    const h = next.hideFromCounterparty ?? hide;
    setSurface(sv);
    upsertIdentity.mutate({ surfaceVisibility: sv, hideFromCounterparty: h });
  };

  const onAudienceChange = (next: PostVisibility) => {
    if (isOpenOwner) {
      updatePostVisibility.mutate(next, {
        onSuccess: () => {
          if (next === 'OnlyMe') {
            persistIdentity({ surfaceVisibility: next, hideFromCounterparty: true });
          }
        },
      });
      return;
    }
    // D-39 (dual-surface): closed-post audience lives entirely on
    // post_actor_identity.surface_visibility for both owner and recipient.
    // The Hidden-screen / Closed-tab routing keys on effective surface
    // (migration 0107), so no `posts.visibility` fan-out is needed.
    // OnlyMe still auto-couples to hide_from_counterparty for clarity even
    // though OnlyMe alone already masks third parties on the partner surface.
    if (next === 'OnlyMe') {
      persistClosed({ surfaceVisibility: next, hideFromCounterparty: true });
      setHide(true);
      return;
    }
    persistClosed({ surfaceVisibility: next });
  };

  const onHideChange = (next: boolean) => {
    if (isOpenOwner) {
      persistIdentity({ surfaceVisibility: audienceValue, hideFromCounterparty: next });
      return;
    }
    persistClosed({ hideFromCounterparty: next });
  };

  return {
    profilePrivacy,
    audienceValue,
    hide,
    saving,
    showCounterpartyRow,
    isOpenOwner,
    onAudienceChange,
    onHideChange,
  };
}
