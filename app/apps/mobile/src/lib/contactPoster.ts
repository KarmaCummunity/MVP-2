// FR-CHAT-004 + FR-CHAT-005 AC4 — open/create chat anchored on the post and
// prefill the auto-message only if the viewer hasn't sent it within the last
// 50 messages.
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
  const recent = await container.chatRepo.getMessages(chat.chatId, 50);
  const template = i18n.t('chat.autoMessage.initial', { title: post.title.trim() });
  const sentBefore = recent.some((m) => m.senderId === viewerId && m.body === template);
  router.push({
    pathname: '/chat/[id]',
    params: sentBefore ? { id: chat.chatId } : { id: chat.chatId, prefill: template },
  });
}
