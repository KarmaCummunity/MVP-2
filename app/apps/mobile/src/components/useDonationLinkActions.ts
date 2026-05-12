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
  isSuperAdmin: boolean;
  onRemoved: (id: string) => void;
  onEdit: (link: DonationLink) => void;
}

export function useDonationLinkActions({ me, isSuperAdmin, onRemoved, onEdit }: Args) {
  const { t } = useTranslation();

  return useCallback(
    (link: DonationLink) => {
      if (Platform.OS === 'web') return;

      const isOwner = link.submittedBy === me;
      const canEditLink = isOwner || isSuperAdmin;
      const canRemoveLink = isOwner || isSuperAdmin;

      if (Platform.OS === 'ios') {
        const actions: { label: string; run: () => void }[] = [
          { label: t('donations.links.rowMenu.open'), run: () => openDonationLinkUrl(link) },
          { label: t('donations.links.rowMenu.report'), run: () => void reportDonationLink(me, link, t) },
        ];
        if (canEditLink) {
          actions.push({ label: t('donations.links.rowMenu.edit'), run: () => onEdit(link) });
        }
        if (canRemoveLink) {
          actions.push({
            label: t('donations.links.rowMenu.remove'),
            run: () => confirmRemoveDonationLink(link, onRemoved, t),
          });
        }
        const cancelLabel = t('donations.addLinkModal.cancel');
        const options = [...actions.map((a) => a.label), cancelLabel];
        const cancelButtonIndex = options.length - 1;
        const destructiveButtonIndex = canRemoveLink ? cancelButtonIndex - 1 : undefined;

        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex, destructiveButtonIndex },
          (idx) => {
            if (idx === cancelButtonIndex) return;
            actions[idx]?.run();
          },
        );
        return;
      }

      const buttons: {
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }[] = [
        { text: t('donations.links.rowMenu.open'), onPress: () => openDonationLinkUrl(link) },
        { text: t('donations.links.rowMenu.report'), onPress: () => void reportDonationLink(me, link, t) },
      ];
      if (canEditLink) {
        buttons.push({ text: t('donations.links.rowMenu.edit'), onPress: () => onEdit(link) });
      }
      if (canRemoveLink) {
        buttons.push({
          text: t('donations.links.rowMenu.remove'),
          onPress: () => confirmRemoveDonationLink(link, onRemoved, t),
          style: 'destructive' as const,
        });
      }
      buttons.push({ text: t('donations.addLinkModal.cancel'), style: 'cancel' as const });

      Alert.alert(link.displayName, undefined, buttons);
    },
    [me, isSuperAdmin, t, onRemoved, onEdit],
  );
}
