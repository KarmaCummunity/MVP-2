// FR-POST-003 + FR-POST-021 — post detail: who may see this post (open → posts.visibility;
// closed participant → surface_visibility) + optional counterparty identity mask (closed only).
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PlatformSwitch, colors, spacing, typography } from '@kc/ui';
import type { PostVisibility } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import { isPostError } from '@kc/application';
import {
  getListPostActorIdentityUseCase,
  getUpdatePostUseCase,
  getUpsertPostActorIdentityUseCase,
} from '../../services/postsComposition';
import { getUserRepo } from '../../services/userComposition';
import { VisibilityChooser } from '../CreatePostForm/VisibilityChooser';
import { useFeedSessionStore } from '../../store/feedSessionStore';
import { mapPostErrorToHebrew } from '../../services/postMessages';

interface Props {
  readonly post: PostWithOwner;
  readonly viewerId: string;
}

function hasMarkedCounterparty(post: PostWithOwner): boolean {
  return Boolean(post.recipientUser ?? post.recipient?.recipientUserId);
}

function inferredClosedSurface(post: PostWithOwner, viewerId: string): PostVisibility {
  if (post.ownerId === viewerId) return post.visibility;
  return 'Public';
}

export function PostActorPrivacyBar({ post, viewerId }: Props) {
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

  return (
    <View style={styles.outer}>
      <VisibilityChooser
        value={audienceValue}
        onChange={onAudienceChange}
        profilePrivacy={profilePrivacy}
        disabled={saving}
        onFollowersOnlyBlockedPress={() =>
          useFeedSessionStore.getState().showEphemeralToast(t('post.visibilityFollowersLockedSub'), 'success', 3200)
        }
      />
      {showCounterpartyRow ? (
        <View style={styles.partnerRow}>
          <Text style={styles.partnerLabel}>{t('post.counterpartyMaskLabel')}</Text>
          <PlatformSwitch
            value={hide}
            onValueChange={(v) => {
              setHide(v);
              persistClosed({ hideFromCounterparty: v });
            }}
            disabled={saving}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  partnerRow: {
    marginTop: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerLabel: { ...typography.bodySmall, flex: 1, color: colors.textPrimary, textAlign: 'right' },
});
