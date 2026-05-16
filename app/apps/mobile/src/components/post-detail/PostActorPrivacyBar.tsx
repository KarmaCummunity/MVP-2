// FR-POST-021 — participant controls: identity exposure on this post + optional counterparty hide (closed only).
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PlatformSwitch, colors, spacing, typography } from '@kc/ui';
import type { PostActorIdentityExposure } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import {
  getListPostActorIdentityUseCase,
  getUpsertPostActorIdentityUseCase,
} from '../../services/postsComposition';
import { PostActorExposurePicker } from './PostActorExposurePicker';

interface Props {
  readonly post: PostWithOwner;
  readonly viewerId: string;
}

function hasMarkedCounterparty(post: PostWithOwner): boolean {
  return Boolean(post.recipientUser ?? post.recipient?.recipientUserId);
}

export function PostActorPrivacyBar({ post, viewerId }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const identityQuery = useQuery({
    queryKey: ['post-actor-identity', post.postId],
    queryFn: () => getListPostActorIdentityUseCase().execute({ postId: post.postId }),
  });

  const myRow = identityQuery.data?.find((r) => r.userId === viewerId);
  const [hide, setHide] = useState(myRow?.hideFromCounterparty ?? false);
  const [exposure, setExposure] = useState<PostActorIdentityExposure>(myRow?.exposure ?? 'Public');

  useEffect(() => {
    setHide(myRow?.hideFromCounterparty ?? false);
    setExposure(myRow?.exposure ?? 'Public');
  }, [myRow?.hideFromCounterparty, myRow?.exposure]);

  const mutation = useMutation({
    mutationFn: (input: { exposure: PostActorIdentityExposure; hideFromCounterparty: boolean }) =>
      getUpsertPostActorIdentityUseCase().execute({
        postId: post.postId,
        userId: viewerId,
        exposure: input.exposure,
        hideFromCounterparty: input.hideFromCounterparty,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['post-actor-identity', post.postId] });
      await qc.invalidateQueries({ queryKey: ['post', post.postId] });
      await qc.invalidateQueries({ queryKey: ['profile-closed-posts'] });
      await qc.invalidateQueries({ queryKey: ['my-hidden-open-posts'] });
      await qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const showCounterpartyRow =
    post.status === 'closed_delivered' && hasMarkedCounterparty(post);

  const persist = (next: { exposure?: PostActorIdentityExposure; hideFromCounterparty?: boolean }) => {
    const e = next.exposure ?? exposure;
    const h = next.hideFromCounterparty ?? hide;
    mutation.mutate({ exposure: e, hideFromCounterparty: h });
  };

  return (
    <View style={styles.outer}>
      <PostActorExposurePicker
        value={exposure}
        disabled={mutation.isPending}
        onSelect={(v) => {
          setExposure(v);
          persist({ exposure: v });
        }}
      />
      {showCounterpartyRow ? (
        <View style={styles.partnerRow}>
          <Text style={styles.partnerLabel}>{t('post.detail.identityHidePartner')}</Text>
          <PlatformSwitch
            value={hide}
            onValueChange={(v) => {
              setHide(v);
              persist({ hideFromCounterparty: v });
            }}
            disabled={mutation.isPending}
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
