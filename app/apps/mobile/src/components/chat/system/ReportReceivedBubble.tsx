// FR-ADMIN-003 — admin-facing system bubble for newly-filed reports.
// Shows dismiss / confirm action buttons to super admins; dimmed once a later
// mod_action_taken bubble references this message.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { container } from '../../../lib/container';
import he from '../../../i18n/he';
import { confirmAndRun, showAdminToast } from './adminActions';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

export function ReportReceivedBubble({
  payload,
  body,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const t = he.moderation;
  const reportId = payload?.report_id as string | undefined;
  const showActions = isAdmin && !handledByLaterAction && !!reportId;

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.reportReceived.title}</Text>
      {body.length > 0 ? <Text style={styles.body}>{body}</Text> : null}
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
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
