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

export function hasMarkedCounterparty(post: PostWithOwner): boolean {
  return Boolean(post.recipientUser ?? post.recipient?.recipientUserId);
}

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
  });
  const profilePrivacy = userQuery.data?.privacyMode ?? 'Public';

  const identityQuery = useQuery({
    queryKey: ['post-actor-identity', post.postId],
    queryFn: () => getListPostActorIdentityUseCase().execute({ postId: post.postId }),
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

  const showCounterpartyRow =
    post.status === 'closed_delivered' && hasMarkedCounterparty(post);

  const persistClosed = (next: { surfaceVisibility?: PostVisibility; hideFromCounterparty?: boolean }) => {
    const sv = next.surfaceVisibility ?? surface;
    const h = next.hideFromCounterparty ?? hide;
    setSurface(sv);
    upsertIdentity.mutate({ surfaceVisibility: sv, hideFromCounterparty: h });
  };

  const onAudienceChange = (next: PostVisibility) => {
    if (isOpenOwner) {
      updatePostVisibility.mutate(next);
      return;
    }
    persistClosed({ surfaceVisibility: next });
  };

  const onHideChange = (next: boolean) => {
    setHide(next);
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
