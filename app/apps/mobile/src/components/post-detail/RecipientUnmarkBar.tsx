import { useTranslation } from 'react-i18next';
// FR-CLOSURE-007 — lets the credited recipient remove their own mark.
// Spec AC1: only on closed_delivered when viewer === recipient.
// Spec AC2: confirmation modal explains consequences.
// Spec AC3: calls rpc_recipient_unmark_self, post→deleted_no_recipient.
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import { ConfirmActionModal } from '../post/ConfirmActionModal';
import { NotifyModal } from '../NotifyModal';
import { getUnmarkRecipientSelfUseCase } from '../../services/postsComposition';

interface Props {
  postId: string;
  userId: string;
}

export function RecipientUnmarkBar({ postId, userId }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notify, setNotify] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      getUnmarkRecipientSelfUseCase().execute({ postId, userId }),
    onSuccess: async () => {
      setConfirmOpen(false);
      await qc.invalidateQueries({ queryKey: ['post', postId] });
      await qc.invalidateQueries({ queryKey: ['my-closed-posts'] });
    },
    onError: () => {
      setConfirmOpen(false);
      setNotify(t('closure.unmarkErrorBody'));
    },
  });

  const cta = t('closure.unmarkSelfCta');
  return (
    <>
      <Pressable
        style={styles.btn}
        onPress={() => setConfirmOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={cta}
      >
        <Text style={styles.btnText}>{cta}</Text>
      </Pressable>
      <ConfirmActionModal
        visible={confirmOpen}
        title={t('closure.unmarkConfirmTitle')}
        message={t('closure.unmarkConfirmBody')}
        confirmLabel={t('closure.unmarkConfirmCta')}
        destructive
        isBusy={mutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutate()}
      />
      <NotifyModal
        visible={notify !== null}
        title={t('general.error')}
        message={notify ?? ''}
        onDismiss={() => setNotify(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  btnText: { ...typography.bodySmall, color: colors.error },
});
