// FR-DONATE-009 — row-menu action handler for DonationLinksList.
// Extracted to keep DonationLinksList.tsx under the 200-LOC cap.
import { useCallback } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DonationLink } from '@kc/domain';
import { container } from '../lib/container';

interface Args {
  me: string | null;
  onRemoved: (id: string) => void;
}

export function useDonationLinkActions({ me, onRemoved }: Args) {
  const { t } = useTranslation();

  return useCallback(
    (link: DonationLink) => {
      const canRemove = link.submittedBy === me;
      const labels = [
        t('donations.links.rowMenu.open'),
        t('donations.links.rowMenu.report'),
        ...(canRemove ? [t('donations.links.rowMenu.remove')] : []),
        t('donations.addLinkModal.cancel'),
      ];
      const removeIdx = canRemove ? 2 : -1;
      const cancelIdx = labels.length - 1;

      const reportLink = async () => {
        if (!me) return;
        try {
          const thread = await container.getSupportThread.execute({ userId: me });
          await container.sendMessage.execute({
            chatId: thread.chatId,
            senderId: me,
            body: `דיווח על קישור (donation_link:${link.id}) — ${link.url}`,
          });
          Alert.alert(t('donations.links.reportSent'));
        } catch {
          Alert.alert(t('donations.addLinkModal.errors.network'));
        }
      };

      const confirmRemove = () =>
        Alert.alert(
          t('donations.links.confirmRemoveTitle'),
          t('donations.links.confirmRemoveBody'),
          [
            { text: t('donations.links.confirmRemoveCancel'), style: 'cancel' },
            {
              text: t('donations.links.confirmRemoveOk'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await container.removeDonationLink.execute(link.id);
                  onRemoved(link.id);
                } catch {
                  Alert.alert(t('donations.addLinkModal.errors.network'));
                }
              },
            },
          ],
        );

      const performAction = (idx: number) => {
        if (idx === 0) Linking.openURL(link.url).catch(() => {});
        else if (idx === 1) void reportLink();
        else if (idx === removeIdx && canRemove) confirmRemove();
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
