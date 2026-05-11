// FR-CHAT-014 + FR-CHAT-015 — sticky anchored-post card at the top of an
// anchored chat. Visible only while post.status === 'open'. Owner sees the
// "סמן כנמסר ✓" CTA wired to the existing closure flow (pre-filled with the
// chat counterpart). Non-owner sees the whole card as a tap-to-open-post
// surface.
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostType } from '@kc/domain';
import { getPostByIdUseCase } from '../../services/postsComposition';
import { useChatStore } from '../../store/chatStore';
import { useClosureStore } from '../../store/closureStore';

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
  const messages = useChatStore((s) => s.threads[chatId]);

  const query = useQuery({
    queryKey: ['post', anchorPostId, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: anchorPostId!, viewerId }),
    enabled: Boolean(anchorPostId),
  });

  // When a `post_closed` system message lands in this chat, invalidate the
  // post query so the card hides instantly even if the user is mid-scroll.
  // This complements the React-Query focus-refetch — it covers the case
  // where the close happened while the chat was foregrounded.
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
    if (sawPostClosedSysMsg) {
      void queryClient.invalidateQueries({ queryKey: ['post', anchorPostId, viewerId] });
    }
  }, [sawPostClosedSysMsg, anchorPostId, viewerId, queryClient]);

  const post = query.data?.post ?? null;

  // FR-CHAT-014 AC3/AC4: hide entirely when no anchor, post missing, or post
  // not in `open` status. Also covers loading + error states — we'd rather
  // hide than show a stale or partial card.
  if (!anchorPostId || !post || post.status !== 'open') return null;

  const isOwner = post.ownerId === viewerId;
  const typeLabel = TYPE_LABEL[post.type];
  const ctaText = post.type === 'Give' ? 'סמן כנמסר ✓' : 'סמן שקיבלתי ✓';

  const openPost = () => {
    router.push({ pathname: '/post/[id]', params: { id: post.postId } });
  };

  const handleClose = () => {
    void startClosure(post.postId, viewerId, post.type, {
      preselectedRecipientId: counterpartId,
    });
  };

  return (
    <Pressable
      onPress={isOwner ? undefined : openPost}
      style={styles.card}
      accessibilityRole={isOwner ? undefined : 'button'}
      accessibilityLabel={isOwner ? undefined : 'פתח את הפוסט'}
    >
      <View style={styles.body}>
        <Text style={styles.typeTag}>{typeLabel}</Text>
        <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
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
