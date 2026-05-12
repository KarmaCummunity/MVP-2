// FR-MOD-007 — Report modal opened from a user profile's overflow menu.
// Mirrors ReportPostModal but submits to container.reportUser (target_type='user').
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import type { ReportReason } from '@kc/domain';
import { ReportError } from '@kc/application';
import { container } from '../../lib/container';
import { useAuthStore } from '../../store/authStore';
import { colors } from '@kc/ui';
import he from '../../i18n/he';

const t = he.moderation;

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'Spam', label: t.reasons.spam },
  { value: 'Offensive', label: t.reasons.offensive },
  { value: 'Misleading', label: t.reasons.misleading },
  { value: 'Illegal', label: t.reasons.illegal },
  { value: 'Other', label: t.reasons.other },
];

interface Props {
  targetUserId: string;
  visible: boolean;
  onClose: () => void;
}

export function ReportUserModal({ targetUserId, visible, onClose }: Props) {
  const userId = useAuthStore((s) => s.session?.userId);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset state when the modal closes so the next open starts fresh.
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
      await container.reportUser.execute({
        reporterId: userId,
        targetUserId,
        reason,
        note: note.trim() || undefined,
      });
      onClose();
      Alert.alert(t.report.user.successToast);
    } catch (err) {
      if (err instanceof ReportError && err.code === 'duplicate_within_24h') {
        Alert.alert(t.report.user.duplicateError);
        onClose();
      } else {
        Alert.alert(t.actions.errors.networkError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.report.user.title}</Text>
          <Text style={styles.label}>{t.report.user.reasonLabel}</Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonRow, reason === r.value && styles.reasonRowActive]}
              onPress={() => setReason(r.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r.value }}
            >
              <Text style={styles.reasonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.note}
            placeholder={t.report.user.noteLabel}
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
              <Text style={styles.btnGhostText}>{t.actions.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={submit}
              disabled={submitting}
              accessibilityState={{ disabled: submitting }}
            >
              <Text style={styles.btnPrimaryText}>
                {submitting ? '...' : t.report.user.submit}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, padding: 16, gap: 8,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  label: { fontSize: 13, color: colors.textSecondary, textAlign: 'right' },
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
