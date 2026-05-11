// FR-DONATE-009 — row-menu action handler for DonationLinksList (native; web uses DonationLinkRowMenu).
import { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DonationLink } from '@kc/domain';
import {
  confirmRemoveDonationLink,
  openDonationLinkUrl,
  reportDonationLink,
} from './donationLinkRowHandlers';

interface Args {
  me: string | null;
  onRemoved: (id: string) => void;
}

export function useDonationLinkActions({ me, onRemoved }: Args) {
  const { t } = useTranslation();

  return useCallback(
    (link: DonationLink) => {
      if (Platform.OS === 'web') return;

      const canRemove = link.submittedBy === me;
      const labels = [
        t('donations.links.rowMenu.open'),
        t('donations.links.rowMenu.report'),
        ...(canRemove ? [t('donations.links.rowMenu.remove')] : []),
        t('donations.addLinkModal.cancel'),
      ];
      const removeIdx = canRemove ? 2 : -1;
      const cancelIdx = labels.length - 1;

      const performAction = (idx: number) => {
        if (idx === 0) openDonationLinkUrl(link);
        else if (idx === 1) void reportDonationLink(me, link, t);
        else if (idx === removeIdx && canRemove) confirmRemoveDonationLink(link, onRemoved, t);
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: labels,
            cancelButtonIndex: cancelIdx,
            destructiveButtonIndex: removeIdx >= 0 ? removeIdx : undefined,
          },
          performAction,
        );
        return;
      }

      Alert.alert(link.displayName, undefined, [
        ...labels.slice(0, cancelIdx).map((label, idx) => ({
          text: label,
          onPress: () => performAction(idx),
          style: idx === removeIdx ? ('destructive' as const) : undefined,
        })),
        { text: labels[cancelIdx], style: 'cancel' as const },
      ]);
    },
    [me, t, onRemoved],
  );
}
