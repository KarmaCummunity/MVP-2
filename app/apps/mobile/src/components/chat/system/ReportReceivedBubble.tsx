// FR-ADMIN-003 / FR-MOD-001 AC4 — admin-facing system bubble for newly-filed
// reports. Renders an admin-gated rich preview card (handle + content snippet
// + tap to open) when payload contains link_target + target_preview, and
// shows dismiss / confirm action buttons to super admins. Dimmed once a
// later mod_action_taken bubble references this message.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { container } from '../../../lib/container';
import he from '../../../i18n/he';
import { confirmAndRun, showAdminToast } from './adminActions';
import type { SystemMessageBubbleProps } from './SystemMessageBubble';

type LinkTarget = { type: 'post' | 'user'; id: string; handle: string };
type PostPreview = {
  kind: 'post';
  author_handle: string;
  author_display_name: string;
  body_snippet: string | null;
  has_image: boolean;
};
type UserPreview = {
  kind: 'user';
  handle: string;
  display_name: string;
  bio_snippet: string | null;
};
type TargetPreview = PostPreview | UserPreview;

function readLinkTarget(p: Record<string, unknown> | null): LinkTarget | null {
  const lt = p?.link_target as Record<string, unknown> | null | undefined;
  if (!lt || typeof lt !== 'object') return null;
  const type = lt.type;
  const id = lt.id;
  const handle = lt.handle;
  if ((type !== 'post' && type !== 'user') || typeof id !== 'string' || typeof handle !== 'string') return null;
  return { type, id, handle };
}

function readPreview(p: Record<string, unknown> | null): TargetPreview | null {
  const tp = p?.target_preview as Record<string, unknown> | null | undefined;
  if (!tp || typeof tp !== 'object') return null;
  if (tp.kind === 'post') {
    return {
      kind: 'post',
      author_handle: String(tp.author_handle ?? ''),
      author_display_name: String(tp.author_display_name ?? ''),
      body_snippet: typeof tp.body_snippet === 'string' ? tp.body_snippet : null,
      has_image: Boolean(tp.has_image),
    };
  }
  if (tp.kind === 'user') {
    return {
      kind: 'user',
      handle: String(tp.handle ?? ''),
      display_name: String(tp.display_name ?? ''),
      bio_snippet: typeof tp.bio_snippet === 'string' ? tp.bio_snippet : null,
    };
  }
  return null;
}

export function ReportReceivedBubble({
  payload,
  body,
  handledByLaterAction,
}: SystemMessageBubbleProps) {
  const isAdmin = useIsSuperAdmin();
  const router = useRouter();
  const t = he.moderation;
  const reportId = payload?.report_id as string | undefined;
  const targetType = payload?.target_type as string | undefined;
  const reason = payload?.reason as string | undefined;
  const showActions = isAdmin && !handledByLaterAction && !!reportId;

  const linkTarget = readLinkTarget(payload);
  const preview = readPreview(payload);
  const showRichPreview = isAdmin && !!linkTarget && !!preview;
  const showChatNote = showRichPreview && targetType === 'chat';

  const navigate = () => {
    if (!linkTarget) return;
    if (linkTarget.type === 'post') {
      router.push({ pathname: '/post/[id]', params: { id: linkTarget.id } });
    } else {
      router.push({ pathname: '/user/[handle]', params: { handle: linkTarget.handle } });
    }
  };

  const a11yLabel =
    preview?.kind === 'post'
      ? t.bubble.targetPreview.a11yOpenPost.replace('{handle}', (preview as PostPreview).author_handle)
      : preview?.kind === 'user'
        ? t.bubble.targetPreview.a11yOpenProfile.replace('{handle}', (preview as UserPreview).handle)
        : '';

  return (
    <View style={[styles.bubble, handledByLaterAction && styles.dimmed]}>
      <Text style={styles.title}>{t.bubble.reportReceived.title}</Text>
      {showChatNote ? <Text style={styles.note}>{t.bubble.targetPreview.chatNote}</Text> : null}
      {reason ? <Text style={styles.body}>{`${reason}`}</Text> : null}

      {showRichPreview && preview && linkTarget ? (
        <Pressable
          onPress={navigate}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          style={styles.card}
        >
          {preview.kind === 'post' ? (
            <>
              <Text style={styles.handle}>
                {`‎@${preview.author_handle} · ${t.bubble.targetPreview.postLabel}`}
              </Text>
              {preview.body_snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {preview.body_snippet}
                </Text>
              ) : null}
              {preview.has_image ? <Text style={styles.snippet}>{t.bubble.targetPreview.hasImage}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.handle}>
                {`‎@${preview.handle} · ${t.bubble.targetPreview.profileLabel}`}
              </Text>
              {preview.display_name ? <Text style={styles.snippet}>{preview.display_name}</Text> : null}
              {preview.bio_snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {preview.bio_snippet}
                </Text>
              ) : null}
            </>
          )}
          <View style={styles.openRow}>
            <Ionicons name="chevron-back" size={16} color="#1a3d8f" />
            <Text style={styles.openText}>{t.bubble.targetPreview.open}</Text>
          </View>
        </Pressable>
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
  card: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0d8b0',
    minHeight: 44,
  },
  handle: { fontWeight: '600' },
  snippet: { fontSize: 13, marginTop: 2 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  openText: { color: '#1a3d8f', fontWeight: '600', fontSize: 13 },
  evidence: { fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  btn: { color: '#1a3d8f', fontWeight: '600' },
});
