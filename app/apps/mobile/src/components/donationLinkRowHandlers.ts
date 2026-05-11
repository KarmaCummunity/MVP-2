// Shared donation-link row actions for native Alert/ActionSheet and web Modal (FR-DONATE-009).
import { Alert, Linking, Platform } from 'react-native';
import type { TFunction } from 'i18next';
import type { DonationLink } from '@kc/domain';
import { container } from '../lib/container';

function alertMessage(message: string): void {
  const w = globalThis.window;
  if (Platform.OS === 'web' && typeof w !== 'undefined') {
    w.alert(message);
    return;
  }
  Alert.alert(message);
}

export function openDonationLinkUrl(link: DonationLink): void {
  Linking.openURL(link.url).catch(() => {});
}

export async function reportDonationLink(
  me: string | null,
  link: DonationLink,
  t: TFunction,
): Promise<void> {
  if (!me) return;
  try {
    const thread = await container.getSupportThread.execute({ userId: me });
    await container.sendMessage.execute({
      chatId: thread.chatId,
      senderId: me,
      body: `דיווח על קישור (donation_link:${link.id}) — ${link.url}`,
    });
    alertMessage(t('donations.links.reportSent'));
  } catch {
    alertMessage(t('donations.addLinkModal.errors.network'));
  }
}

export function confirmRemoveDonationLink(
  link: DonationLink,
  onRemoved: (id: string) => void,
  t: TFunction,
): void {
  const runRemove = async () => {
    try {
      await container.removeDonationLink.execute(link.id);
      onRemoved(link.id);
    } catch {
      alertMessage(t('donations.addLinkModal.errors.network'));
    }
  };

  if (Platform.OS === 'web' && typeof globalThis.window !== 'undefined') {
    const ok = globalThis.window.confirm(
      `${t('donations.links.confirmRemoveTitle')}\n\n${t('donations.links.confirmRemoveBody')}`,
    );
    if (ok) void runRemove();
    return;
  }

  Alert.alert(
    t('donations.links.confirmRemoveTitle'),
    t('donations.links.confirmRemoveBody'),
    [
      { text: t('donations.links.confirmRemoveCancel'), style: 'cancel' },
      {
        text: t('donations.links.confirmRemoveOk'),
        style: 'destructive',
        onPress: () => void runRemove(),
      },
    ],
  );
}
