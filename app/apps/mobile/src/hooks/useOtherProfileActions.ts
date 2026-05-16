// Action handlers for the Other-Profile screen. Extracted from
// app/user/[handle]/index.tsx to keep that screen under the 200-LOC cap (TD-29).
import { useRouter } from 'expo-router';
import type { User } from '@kc/domain';
import type { FollowState } from '@kc/application';
import { container } from '../lib/container';
import { consumePreferNewThread } from '../lib/chatNavigationPrefs';

export interface UseOtherProfileActionsArgs {
  me: string | undefined;
  target: User | null;
  dispatchFollowAction: (action: 'follow' | 'unfollow' | 'send' | 'cancel') => void;
}

export function useOtherProfileActions({ me, target, dispatchFollowAction }: UseOtherProfileActionsArgs) {
  const router = useRouter();

  const onFollowPress = (state: FollowState | undefined) => {
    if (state === 'not_following_public') dispatchFollowAction('follow');
    else if (state === 'following') dispatchFollowAction('unfollow');
    else if (state === 'not_following_private_no_request') dispatchFollowAction('send');
    else if (state === 'request_pending') dispatchFollowAction('cancel');
  };

  const startChat = async () => {
    if (!me || !target) return;
    const preferNewThread = consumePreferNewThread(target.userId);
    const chat = await container.openOrCreateChat.execute({
      viewerId: me,
      otherUserId: target.userId,
      preferNewThread,
    });
    router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } });
  };

  return { onFollowPress, startChat };
}
