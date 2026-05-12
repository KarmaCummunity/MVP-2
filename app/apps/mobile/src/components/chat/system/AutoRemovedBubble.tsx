// FR-ADMIN-002 / FR-ADMIN-004 — admin-facing bubble for auto-removed targets.
// Shows restore + (for user targets) ban actions to super admins. Uses
// useAuthStore at component top to grab adminId — no runtime require().
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { useAuthStore } from '../../../store/authStore';
import { container } from '../../../lib/container';
import he from '../../../i18n/he';
import { confirmAndRun, showAdminToast } from './adminActions';
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

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.autoRemoved.title}</Text>
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
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
