// FR-CHAT-004 + FR-CHAT-005 AC4 — open/create chat anchored on the post and
// prefill the auto-message only if the viewer hasn't sent it within the last
// 50 messages. Extracted from app/post/[id].tsx to keep the route file under
// the 200-line cap.
import type { Post } from '@kc/domain';
import type { useRouter } from 'expo-router';
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
  const template = container.buildAutoMessage.execute({ postTitle: post.title });
  const sentBefore = recent.some((m) => m.senderId === viewerId && m.body === template);
  router.push({
    pathname: '/chat/[id]',
    params: sentBefore ? { id: chat.chatId } : { id: chat.chatId, prefill: template },
  });
}
