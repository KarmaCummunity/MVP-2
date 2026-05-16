// FR-ADMIN-003 / FR-MOD-001 AC4 — admin-facing system bubble for newly-filed
// reports. Shows a rich preview card (admin-only) when the payload contains
// link_target + target_preview, and dismiss / confirm action buttons to
// super admins. Dimmed once a later mod_action_taken bubble references this
// message.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { container } from '../../../lib/container';
import he from '../../../i18n/locales/he';
import { confirmAndRun, showAdminToast } from './adminActions';
import { readLinkTarget, readPreview, TargetPreviewCard } from './targetPreviewCard';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

export function ReportReceivedBubble({
  payload,
  body,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const t = he.moderation;
  const reportId = payload?.report_id as string | undefined;
  const targetType = payload?.target_type as string | undefined;
  const reason = payload?.reason as string | undefined;
  // The trigger writes the raw `Report.reason` enum (PascalCase). The Hebrew
  // mapping is keyed by lowercase — case-fold then look up, with the original
  // enum as a safe fallback for unknown values (e.g. a future-added reason
  // not yet translated).
  const reasonLabel = reason
    ? (t.reasons as Record<string, string>)[reason.toLowerCase()] ?? reason
    : undefined;
  const showActions = isAdmin && !handledByLaterAction && !!reportId;

  const linkTarget = readLinkTarget(payload);
  const preview = readPreview(payload);
  const showRichPreview = isAdmin && !!linkTarget && !!preview;
  const showChatNote = showRichPreview && targetType === 'chat';

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.reportReceived.title}</Text>
      {showChatNote ? <Text style={styles.note}>{t.bubble.targetPreview.chatNote}</Text> : null}
      {reasonLabel ? <Text style={styles.body}>{reasonLabel}</Text> : null}

      {showRichPreview && linkTarget && preview ? (
        <TargetPreviewCard linkTarget={linkTarget} preview={preview} borderColor="#e0d8b0" />
      ) : null}

      {showRichPreview ? <Text style={styles.evidence}>{t.bubble.targetPreview.evidenceLabel}</Text> : null}

      {body.length > 0 ? (
        <Text style={styles.body}>
          <Text style={styles.noteLabel}>{`${t.bubble.targetPreview.reporterNoteLabel} `}</Text>
          {body}
        </Text>
      ) : null}

      {showActions ? (
        <View style={styles.row}>
          <Pressable
            onPress={() =>
              confirmAndRun({
                action: 'dismiss',
                onConfirm: () => container.dismissReport.execute({ reportId: reportId! }),
                onSuccess: () => showAdminToast(t.actions.success.dismiss),
                onError: showAdminToast,
              })
            }
          >
            <Text style={styles.btn}>{t.actions.dismiss}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              confirmAndRun({
                action: 'confirm',
                onConfirm: () => container.confirmReport.execute({ reportId: reportId! }),
                onSuccess: () => showAdminToast(t.actions.success.confirm),
                onError: showAdminToast,
              })
            }
          >
            <Text style={styles.btn}>{t.actions.confirm}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 8,
    backgroundColor: '#fff7e0',
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  dimmed: { opacity: 0.5 },
  title: { fontWeight: '600' },
  body: { marginTop: 2, fontSize: 13 },
  noteLabel: { fontWeight: '600' },
  note: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 2 },
  evidence: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
