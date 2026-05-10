// FR-CLOSURE-001 + FR-CLOSURE-005 — owner CTAs on PostDetail.
//   open                              → "סמן כנמסר ✓"
//   closed_delivered                  → "📤 פתח מחדש"
//   deleted_no_recipient (in grace)   → "📤 פתח מחדש"
//   deleted_no_recipient (past grace) → no CTA (post is on its way out)
//   removed_admin / expired           → no CTA
import { useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { Post } from '@kc/domain';
import { isPostError, type PostErrorCode } from '@kc/application';
import { useClosureStore } from '../../store/closureStore';
import { getReopenPostUseCase } from '../../services/postsComposition';
import { mapPostErrorToHebrew } from '../../services/postMessages';
import { ClosureSheet } from './ClosureSheet';
import { ClosureExplainerSheet } from './ClosureExplainerSheet';
import { ReopenConfirmModal } from './ReopenConfirmModal';

interface Props {
  post: Post;
  ownerId: string;
  onAfterMutation: () => void;
}

export function OwnerActionsBar({ post, ownerId, onAfterMutation }: Props) {
  const startClosure = useClosureStore((s) => s.start);
  const closureStep = useClosureStore((s) => s.step);
  const closureBusy = useClosureStore((s) => s.isBusy);
  const resetClosure = useClosureStore((s) => s.reset);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // When the closure flow finishes, refresh the parent's data. MUST run in
  // useEffect — calling parent setState during render is a React anti-pattern
  // (B2). Reset the store here too so the next closure starts clean.
  useEffect(() => {
    if (closureStep === 'done') {
      resetClosure();
      onAfterMutation();
    }
  }, [closureStep, resetClosure, onAfterMutation]);

  const isOpen = post.status === 'open';
  const isReopenable =
    post.status === 'closed_delivered' ||
    (post.status === 'deleted_no_recipient' &&
      post.deleteAfter !== null &&
      new Date(post.deleteAfter).getTime() > Date.now());

  if (!isOpen && !isReopenable) {
    // No CTA — post is in a terminal state.
    return null;
  }

  async function handleReopen() {
    setIsReopening(true);
    setReopenError(null);
    try {
      await getReopenPostUseCase().execute({ postId: post.postId, ownerId });
      setReopenOpen(false);
      onAfterMutation();
    } catch (e) {
      const code: PostErrorCode = isPostError(e) ? e.code : 'unknown';
      setReopenError(mapPostErrorToHebrew(code));
    } finally {
      setIsReopening(false);
    }
  }

  return (
    <>
      <View style={styles.bar}>
        {isOpen ? (
          <Pressable
            style={[styles.btnPrimary, (closureBusy || closureStep !== 'idle') && styles.btnDisabled]}
            disabled={closureBusy || closureStep !== 'idle'}
            onPress={() => startClosure(post.postId, ownerId)}
            accessibilityLabel="סמן כנמסר"
          >
            <Text style={styles.btnPrimaryText}>סמן כנמסר ✓</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btnPrimary, (isReopening || reopenOpen) && styles.btnDisabled]}
            disabled={isReopening || reopenOpen}
            onPress={() => {
              setReopenError(null);
              setReopenOpen(true);
            }}
            accessibilityLabel="פתח מחדש"
          >
            <Text style={styles.btnPrimaryText}>📤 פתח מחדש</Text>
          </Pressable>
        )}
      </View>

      <ClosureSheet />
      <ClosureExplainerSheet />
      <ReopenConfirmModal
        visible={reopenOpen}
        variant={post.status === 'closed_delivered' ? 'closed_delivered' : 'deleted_no_recipient'}
        isBusy={isReopening}
        errorMessage={reopenError}
        onCancel={() => {
          if (isReopening) return;
          setReopenOpen(false);
          setReopenError(null);
        }}
        onConfirm={() => {
          void handleReopen();
        }}
      />

      {isReopening ? (
        <View style={styles.busyOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnPrimary: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { ...typography.button, color: colors.textInverse },
  btnDisabled: { opacity: 0.5 },
  busyOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
