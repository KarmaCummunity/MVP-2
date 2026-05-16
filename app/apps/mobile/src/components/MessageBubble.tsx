// Bubble for a single chat message — FR-CHAT-002 AC2/AC4.
// FR-ADMIN-005 — admins can long-press a user-kind bubble to hard-delete it.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OptimisticMessage } from '../store/chatStore';
import { colors, typography, spacing, radius } from '@kc/ui';
import { SystemMessageBubble } from './chat/system/SystemMessageBubble';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import { container } from '../lib/container';
import { confirmAndRun, showAdminToast } from './chat/system/adminActions';
import { formatMessageBubbleTime } from '../lib/chatMessageDisplayTime';
import he from '../i18n/locales/he';

const KNOWN_MOD_KINDS = [
  'report_received',
  'auto_removed',
  'mod_action_taken',
  'owner_auto_removed',
] as const;

export function MessageBubble({
  m, mine, onRetry, handledByLaterAction,
}: {
  m: OptimisticMessage;
  mine: boolean;
  onRetry: () => void;
  handledByLaterAction?: boolean;
}) {
  const [showTime, setShowTime] = useState(false);
  const isAdmin = useIsSuperAdmin();

  // System messages (FR-CHAT-007 / FR-MOD-002) — moderation kinds delegate to
  // SystemMessageBubble; unknown/legacy kinds keep the existing neutral pill.
  if (m.kind === 'system') {
    const kind = (m.systemPayload as { kind?: string } | null)?.kind;
    if (kind && (KNOWN_MOD_KINDS as readonly string[]).includes(kind)) {
      return (
        <SystemMessageBubble
          messageId={m.messageId}
          payload={m.systemPayload}
          body={m.body}
          createdAt={m.createdAt}
          handledByLaterAction={handledByLaterAction ?? false}
        />
      );
    }
    return (
      <View style={styles.systemWrap}>
        <View style={styles.systemPill}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.systemText}>{m.body}</Text>
        </View>
      </View>
    );
  }

  // FR-ADMIN-005 AC2 — admin hard-delete via long-press; deletion propagates
  // through Realtime DELETE events, so the bubble disappears on its own.
  const onAdminLongPress = isAdmin && m.messageId
    ? () => {
        const messageId = m.messageId!;
        confirmAndRun({
          action: 'deleteMessage',
          onConfirm: () => container.deleteMessage.execute({ messageId }),
          onSuccess: () => showAdminToast(he.moderation.actions.success.deleteMessage),
          onError: showAdminToast,
        });
      }
    : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setShowTime((s) => !s)}
      onLongPress={onAdminLongPress}
      delayLongPress={400}
    >
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{m.body}</Text>
        <View style={styles.bubbleMeta}>
          {m.failed && (
            <TouchableOpacity onPress={onRetry}><Ionicons name="refresh" size={14} color={colors.textInverse} /></TouchableOpacity>
          )}
          {mine && !m.failed && <Text style={styles.readReceipt}>{m.status === 'read' ? '✓✓' : '✓'}</Text>}
          {showTime && (
            <Text style={[styles.timeText, mine && { color: 'rgba(255,255,255,0.7)' }]}>
              {formatMessageBubbleTime(m.createdAt)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, gap: 4 },
  bubbleMine: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
  bubbleOther: { alignSelf: 'flex-end', backgroundColor: colors.surface, borderBottomRightRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { ...typography.body },
  bubbleTextMine: { color: colors.textInverse },
  bubbleTextOther: { color: colors.textPrimary, textAlign: 'right' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  timeText: { ...typography.caption, color: colors.textSecondary },
  readReceipt: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  systemWrap: { alignItems: 'center', paddingVertical: spacing.xs },
  systemPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full,
    maxWidth: '90%',
  },
  systemText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
