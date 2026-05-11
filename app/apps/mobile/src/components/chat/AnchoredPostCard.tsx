// FR-CHAT-014 + FR-CHAT-015 — sticky anchored-post card at the top of an
// anchored chat. Visible only while post.status === 'open'. Both owner and
// non-owner can tap the card body to open the post. Owner also sees a CTA
// button ("סמן כנמסר ✓") that opens the closure flow pre-filled with the
// chat counterpart. ClosureSheet + ClosureExplainerSheet are rendered here
// (not in OwnerActionsBar) so they appear in the chat context.
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { GestureResponderEvent } from 'react-native';
import type { PostType } from '@kc/domain';
import { getPostByIdUseCase } from '../../services/postsComposition';
import { useChatStore } from '../../store/chatStore';
import { useClosureStore } from '../../store/closureStore';
import { ClosureSheet } from '../closure/ClosureSheet';
import { ClosureExplainerSheet } from '../closure/ClosureExplainerSheet';

interface Props {
  chatId: string;
  anchorPostId: string | null;
  viewerId: string;
  counterpartId: string;
}

const TYPE_LABEL: Record<PostType, string> = {
  Give: 'נותן',
  Request: 'מבקש',
};

export function AnchoredPostCard({ chatId, anchorPostId, viewerId, counterpartId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const startClosure = useClosureStore((s) => s.start);
  const closureStep = useClosureStore((s) => s.step);
  const closureInitiator = useClosureStore((s) => s.initiator);
  const resetClosure = useClosureStore((s) => s.reset);
  const messages = useChatStore((s) => s.threads[chatId]);

  const query = useQuery({
    queryKey: ['post', anchorPostId, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: anchorPostId!, viewerId }),
    enabled: Boolean(anchorPostId),
  });

  // When a `post_closed` system message lands in this chat, invalidate the
  // post query so the card hides — but only when there is no active closure
  // in progress (mid-closure the query will be invalidated by the done handler
  // below, after the explainer sheet is dismissed).
  const sawPostClosedSysMsg = useMemo(() => {
    if (!messages || !anchorPostId) return false;
    return messages.some(
      (m) =>
        m.kind === 'system' &&
        m.systemPayload != null &&
        (m.systemPayload as Record<string, unknown>).kind === 'post_closed' &&
        (m.systemPayload as Record<string, unknown>).post_id === anchorPostId,
    );
  }, [messages, anchorPostId]);

  useEffect(() => {
    if (sawPostClosedSysMsg && closureStep === 'idle') {
      void queryClient.invalidateQueries({ queryKey: ['post', anchorPostId, viewerId] });
    }
  }, [sawPostClosedSysMsg, closureStep, anchorPostId, viewerId, queryClient]);

  // When closure was initiated from this chat card, handle the done state here.
  // OwnerActionsBar (post-detail context) guards its own handler so it won't
  // fire for chat-initiated closures.
  useEffect(() => {
    if (closureStep === 'done' && closureInitiator === 'chat') {
      resetClosure();
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      void queryClient.invalidateQueries({ queryKey: ['my-open-count'] });
      void queryClient.invalidateQueries({ queryKey: ['post', anchorPostId, viewerId] });
    }
  }, [closureStep, closureInitiator, resetClosure, queryClient, anchorPostId, viewerId]);

  const post = query.data?.post ?? null;
  const isOwner = post ? post.ownerId === viewerId : false;

  // FR-CHAT-014 AC3/AC4: hide card when there is no open post. Keep the
  // component mounted (for modals) while a chat-initiated closure is in
  // flight so the ClosureExplainerSheet is not unmounted mid-flow.
  const showCard = Boolean(anchorPostId && post && post.status === 'open');
  const isActiveChatClosure = closureInitiator === 'chat' && closureStep !== 'idle';

  if (!showCard && !isActiveChatClosure) return null;

  const typeLabel = post ? TYPE_LABEL[post.type] : '';
  const ctaText = post?.type === 'Give' ? 'סמן כנמסר ✓' : 'סמן שקיבלתי ✓';

  const openPost = () => {
    if (!post) return;
    router.push({ pathname: '/post/[id]', params: { id: post.postId } });
  };

  const handleClose = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (!post) return;
    void startClosure(post.postId, viewerId, post.type, {
      preselectedRecipientId: counterpartId,
      initiator: 'chat',
    });
  };

  return (
    <>
      {showCard ? (
        <Pressable
          onPress={openPost}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel="פתח את הפוסט"
        >
          <View style={styles.body}>
            <Text style={styles.typeTag}>{typeLabel}</Text>
            <Text style={styles.title} numberOfLines={1}>{post!.title}</Text>
          </View>
          {isOwner ? (
            <Pressable
              onPress={handleClose}
              style={styles.cta}
              accessibilityRole="button"
              accessibilityLabel={ctaText}
            >
              <Text style={styles.ctaText}>{ctaText}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      ) : null}
      {(isOwner || isActiveChatClosure) ? (
        <>
          <ClosureSheet />
          <ClosureExplainerSheet />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { flex: 1, gap: 4 },
  typeTag: {
    ...typography.caption,
    alignSelf: 'flex-end',
    color: colors.textSecondary,
    backgroundColor: colors.skeleton,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    fontWeight: '600',
  },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  ctaText: { ...typography.button, color: colors.textInverse, fontSize: 14 },
});
