// FR-MOD-001 — Report modal opened from post-detail ⋮ menu. Mirror of ReportChatModal.
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ReportReason } from '@kc/domain';
import { ReportError } from '@kc/application';
import { container } from '../../lib/container';
import { useAuthStore } from '../../store/authStore';
import { colors } from '@kc/ui';
import { NotifyModal } from '../NotifyModal';

const REASON_KEYS: Array<{ value: ReportReason; key: string }> = [
  { value: 'Spam', key: 'post.reportReasonSpam' },
  { value: 'Offensive', key: 'post.reportReasonOffensive' },
  { value: 'Misleading', key: 'post.reportReasonMisleading' },
  { value: 'Illegal', key: 'post.reportReasonIllegal' },
  { value: 'Other', key: 'post.reportReasonOther' },
];

interface Props {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

export function ReportPostModal({ postId, visible, onClose }: Props) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.userId);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // TD-138: Alert.alert is a no-op on react-native-web — surface result via NotifyModal.
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  // Reset to defaults when the modal closes so the next open starts fresh
  // (otherwise reason/note persist across openings on the same mounted
  // instance — see CodeRabbit on PR #51).
  useEffect(() => {
    if (!visible) {
      setReason('Spam');
      setNote('');
      setSubmitting(false);
    }
  }, [visible]);

  const submit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await container.reportPost.execute({
        reporterId: userId,
        postId,
        reason,
        note: note.trim() || undefined,
      });
      onClose();
      setNotify({ title: t('post.reportSuccessTitle'), message: t('post.reportSuccessBody') });
    } catch (err) {
      if (err instanceof ReportError && err.code === 'duplicate_within_24h') {
        onClose();
        setNotify({ title: t('post.reportDuplicateTitle'), message: t('post.reportDuplicateBody') });
      } else {
        setNotify({ title: t('general.error'), message: t('post.reportErrorBody') });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('post.reportTitle')}</Text>
          {REASON_KEYS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonRow, reason === r.value && styles.reasonRowActive]}
              onPress={() => setReason(r.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r.value }}
            >
              <Text style={styles.reasonText}>{t(r.key)}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.note}
            placeholder={t('post.reportNotePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            textAlign="right"
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.btnGhostText}>{t('general.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={submit}
              disabled={submitting}
              accessibilityState={{ disabled: submitting }}
            >
              <Text style={styles.btnPrimaryText}>{submitting ? t('post.reportSubmitting') : t('post.reportSubmit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    <NotifyModal visible={notify !== null} title={notify?.title ?? ''} message={notify?.message ?? ''} onDismiss={() => setNotify(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, padding: 16, gap: 8,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  reasonRow: {
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  reasonRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  reasonText: { fontSize: 15, color: colors.textPrimary, textAlign: 'right' },
  note: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, minHeight: 80, fontSize: 15, color: colors.textPrimary,
  },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  btnGhostText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
