// FR-PROFILE-005 / FR-PROFILE-006 — Public ↔ Private toggle with confirmation.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserRepo } from '../services/userComposition';
import { getUpdatePrivacyModeUseCase } from '../services/followComposition';

export function usePrivateProfileToggle(userId: string | undefined) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
  });
  const user = userQuery.data;
  const isPrivate = user?.privacyMode === 'Private';

  const [pendingTarget, setPendingTarget] = React.useState<'Private' | 'Public' | null>(null);
  const [busyToggle, setBusyToggle] = React.useState(false);

  const onToggle = (next: boolean) => {
    if (!userId || !user) return;
    setPendingTarget(next ? 'Private' : 'Public');
  };

  const confirmToggle = async () => {
    if (!userId || !pendingTarget) return;
    setBusyToggle(true);
    try {
      await getUpdatePrivacyModeUseCase().execute({ userId, mode: pendingTarget });
      qc.invalidateQueries({ queryKey: ['user-profile', userId] });
      qc.invalidateQueries({ queryKey: ['pending-requests-count', userId] });
      setPendingTarget(null);
    } catch {
      setPendingTarget(null);
    } finally {
      setBusyToggle(false);
    }
  };

  const confirmModal =
    pendingTarget === null
      ? null
      : {
          visible: true as const,
          title:
            pendingTarget === 'Private'
              ? t('settings.privacyScreen.confirmPrivateTitle')
              : t('settings.privacyScreen.confirmPublicTitle'),
          message:
            pendingTarget === 'Private'
              ? t('settings.privacyScreen.confirmPrivateMessage')
              : t('settings.privacyScreen.confirmPublicMessage'),
          confirmLabel:
            pendingTarget === 'Private'
              ? t('settings.privacyScreen.confirmPrivateCta')
              : t('settings.privacyScreen.confirmPublicCta'),
          isBusy: busyToggle,
          onCancel: () => {
            if (!busyToggle) setPendingTarget(null);
          },
          onConfirm: confirmToggle,
        };

  return {
    isPrivate: isPrivate ?? false,
    canToggle: Boolean(user),
    onToggle,
    confirmModal,
  };
}
