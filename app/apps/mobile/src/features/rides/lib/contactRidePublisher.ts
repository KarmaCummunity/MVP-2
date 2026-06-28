// FR-RIDE-004 + FR-RIDE-005 — open/create chat anchored on the ride; prefill via route param.
import type { useRouter } from 'expo-router';
import i18n from '../../../i18n';
import { ridesComposition } from '../composition/ridesComposition';
import { consumePreferNewThread } from '../../../lib/chatNavigationPrefs';

type Router = ReturnType<typeof useRouter>;

export async function contactRidePublisher(
  viewerId: string | null,
  ride: { rideId: string; ownerId: string; title: string },
  router: Router,
): Promise<void> {
  if (!viewerId) return;
  const preferNewThread = consumePreferNewThread(ride.ownerId);
  const chat = await ridesComposition.openOrCreateChat.execute({
    viewerId,
    otherUserId: ride.ownerId,
    anchorRideId: ride.rideId,
    preferNewThread,
  });
  const template = i18n.t('chat.autoMessage.rideInitial', { title: ride.title.trim() });
  router.push({
    pathname: '/chat/[id]',
    params: { id: chat.chatId, prefill: template },
  });
}
