import { useTranslation } from 'react-i18next';
// FR-CHAT-010 — Report modal opened from chat ⋮ menu.
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import type { ReportReason } from '@kc/domain';
import { ReportError } from '@kc/application';
import { container } from '../lib/container';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius } from '@kc/ui';
import { NotifyModal } from './NotifyModal';

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'Spam', label: t('moderation.reasons.spam') },
  { value: 'Offensive', label: t('moderation.reasons.offensive') },
  { value: 'Misleading', label: t('moderation.reasons.misleading') },
  { value: 'Illegal', label: t('moderation.reasons.illegal') },
  { value: 'Other', label: t('moderation.reasons.other') },
];

interface Props {
  chatId: string;
  visible: boolean;
  onClose: () => void;
}

export function ReportChatModal({ chatId, visible, onClose }: Props) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.userId);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // TD-138: Alert.alert is a no-op on react-native-web — surface result via NotifyModal.
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  const submit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await container.reportChat.execute({
        reporterId: userId,
        chatId,
        reason,
        note: note.trim() || undefined,
      });
      onClose();
      setNotify({ title: t('moderation.reportChat.successTitle'), message: t('moderation.reportChat.successMessage') });
    } catch (err) {
      if (err instanceof ReportError && err.code === 'duplicate_within_24h') {
        onClose();
        setNotify({ title: t('moderation.reportChat.duplicateTitle'), message: t('moderation.reportChat.duplicateMessage') });
      } else {
        setNotify({ title: t('moderation.reportChat.errorTitle'), message: t('moderation.reportChat.errorMessage') });
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
          <Text style={styles.title}>{t('moderation.reportChat.title')}</Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={styles.option}
              onPress={() => setReason(r.value)}
            >
              <View style={[styles.radio, reason === r.value && styles.radioActive]} />
              <Text style={styles.optionLabel}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.note}
            value={note}
            onChangeText={setNote}
            placeholder={t('moderation.reportChat.notePlaceholder')}
            placeholderTextColor={colors.textDisabled}
            multiline
            maxLength={500}
            textAlign="right"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>{t('general.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={submit}
              disabled={submitting}
            >
              <Text style={styles.btnPrimaryText}>{submitting ? '...' : t('moderation.report.user.submit')}</Text>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionLabel: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  note: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { ...typography.body, color: colors.textPrimary },
});
