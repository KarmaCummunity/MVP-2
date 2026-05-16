// FR-POST-021 — participant toggle: hide my display from the counterparty on this closed post.
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '@kc/ui';
import type { PostActorIdentityExposure } from '@kc/domain';
import type { PostWithOwner } from '@kc/application';
import {
  getListPostActorIdentityUseCase,
  getUpsertPostActorIdentityUseCase,
} from '../../services/postsComposition';

interface Props {
  post: PostWithOwner;
  viewerId: string;
}

export function PostActorPrivacyBar({ post, viewerId }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const identityQuery = useQuery({
    queryKey: ['post-actor-identity', post.postId],
    queryFn: () => getListPostActorIdentityUseCase().execute({ postId: post.postId }),
    enabled: post.status === 'closed_delivered',
  });

  const myRow = identityQuery.data?.find((r) => r.userId === viewerId);
  const [hide, setHide] = useState(myRow?.hideFromCounterparty ?? false);

  useEffect(() => {
    setHide(myRow?.hideFromCounterparty ?? false);
  }, [myRow?.hideFromCounterparty]);

  const exposure: PostActorIdentityExposure = myRow?.exposure ?? 'Public';

  const mutation = useMutation({
    mutationFn: (nextHide: boolean) =>
      getUpsertPostActorIdentityUseCase().execute({
        postId: post.postId,
        userId: viewerId,
        exposure,
        hideFromCounterparty: nextHide,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['post-actor-identity', post.postId] });
      await qc.invalidateQueries({ queryKey: ['post', post.postId] });
      await qc.invalidateQueries({ queryKey: ['profile-closed-posts'] });
      await qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (post.status !== 'closed_delivered') return null;

  return (
    <View style={styles.box}>
      <Text style={styles.label}>{t('post.detail.identityHidePartner')}</Text>
      <Switch
        value={hide}
        onValueChange={(v) => {
          setHide(v);
          mutation.mutate(v);
        }}
        disabled={mutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { ...typography.bodySmall, flex: 1, color: colors.textPrimary, textAlign: 'right' },
});
