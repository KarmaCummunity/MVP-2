// FR-CHAT-004 + FR-CHAT-005 AC4 — open/create chat anchored on the post; prefill
// auto-message via route param. Duplicate detection runs on the chat screen once
// thread history is loaded (avoids a blocking getMessages before navigation).
import type { Post } from '@kc/domain';
import type { useRouter } from 'expo-router';
import i18n from '../i18n';
import { container } from './container';
import { consumePreferNewThread } from './chatNavigationPrefs';

type Router = ReturnType<typeof useRouter>;

export async function contactPoster(
  viewerId: string | null,
  post: Post,
  router: Router,
): Promise<void> {
  if (!viewerId) return;
  const preferNewThread = consumePreferNewThread(post.ownerId);
  const chat = await container.openOrCreateChat.execute({
    viewerId,
    otherUserId: post.ownerId,
    anchorPostId: post.postId,
    preferNewThread,
  });
  const template = i18n.t('chat.autoMessage.initial', { title: post.title.trim() });
  router.push({
    pathname: '/chat/[id]',
    params: { id: chat.chatId, prefill: template },
  });
}
