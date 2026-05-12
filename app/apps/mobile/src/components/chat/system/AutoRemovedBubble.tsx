// FR-ADMIN-002 / FR-ADMIN-004 / FR-MOD-005 AC3 — admin-facing bubble for
// auto-removed targets. Shows restore + (for user targets) ban actions to
// super admins, plus a rich preview card when the enriched payload
// (link_target + target_preview) is present.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { useAuthStore } from '../../../store/authStore';
import { container } from '../../../lib/container';
import he from '../../../i18n/he';
import { confirmAndRun, showAdminToast } from './adminActions';
import { readLinkTarget, readPreview, TargetPreviewCard } from './targetPreviewCard';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

type TargetType = 'post' | 'user' | 'chat';

export function AutoRemovedBubble({
  payload,
  body,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const me = useAuthStore((s) => s.session?.userId ?? null);
  const t = he.moderation;
  const targetType = payload?.target_type as TargetType | undefined;
  const targetId = payload?.target_id as string | undefined;
  const showActions = isAdmin && !handledByLaterAction && !!targetType && !!targetId;

  const linkTarget = readLinkTarget(payload);
  const preview = readPreview(payload);
  const showRichPreview = isAdmin && !!linkTarget && !!preview;
  const showChatNote = showRichPreview && targetType === 'chat';

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.autoRemoved.title}</Text>
      {showChatNote ? <Text style={styles.note}>{t.bubble.targetPreview.chatNote}</Text> : null}

      {showRichPreview && linkTarget && preview ? (
        <TargetPreviewCard linkTarget={linkTarget} preview={preview} borderColor="#dcc88a" />
      ) : null}

      {showRichPreview ? <Text style={styles.evidence}>{t.bubble.targetPreview.evidenceLabel}</Text> : null}

      {body.length > 0 ? <Text style={styles.body}>{body}</Text> : null}

      {showActions ? (
        <View style={styles.row}>
          <Pressable
            onPress={() =>
              confirmAndRun({
                action: 'restore',
                onConfirm: () =>
                  container.restoreTarget.execute({
                    targetType: targetType!,
                    targetId: targetId!,
                  }),
                onSuccess: () => showAdminToast(t.actions.success.restore),
                onError: showAdminToast,
              })
            }
          >
            <Text style={styles.btn}>{t.actions.restore}</Text>
          </Pressable>
          {targetType === 'user' && me ? (
            <Pressable
              onPress={() =>
                confirmAndRun({
                  action: 'ban',
                  onConfirm: () =>
                    container.banUser.execute({
                      adminId: me,
                      targetUserId: targetId!,
                      reason: 'policy_violation',
                      note: 'auto-removed at threshold',
                    }),
                  onSuccess: () => showAdminToast(t.actions.success.ban),
                  onError: showAdminToast,
                })
              }
            >
              <Text style={styles.btn}>{t.actions.ban}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 8,
    backgroundColor: '#fff0d0',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  dimmed: { opacity: 0.5 },
  title: { fontWeight: '600' },
  body: { marginTop: 2, fontSize: 13 },
  note: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 2 },
  evidence: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
