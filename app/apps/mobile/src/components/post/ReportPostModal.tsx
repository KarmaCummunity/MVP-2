// FR-MOD-001 — Report modal opened from post-detail ⋮ menu. Mirror of ReportChatModal.
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import type { ReportReason } from '@kc/domain';
import { ReportError } from '@kc/application';
import { container } from '../../lib/container';
import { useAuthStore } from '../../store/authStore';
import { colors } from '@kc/ui';

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'Spam', label: 'ספאם' },
  { value: 'Offensive', label: 'תוכן פוגעני' },
  { value: 'Misleading', label: 'מטעה' },
  { value: 'Illegal', label: 'בלתי חוקי' },
  { value: 'Other', label: 'אחר' },
];

interface Props {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

export function ReportPostModal({ postId, visible, onClose }: Props) {
  const userId = useAuthStore((s) => s.session?.userId);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      Alert.alert('הדיווח נשלח', 'תודה, נבחן את הדיווח.');
    } catch (err) {
      if (err instanceof ReportError && err.code === 'duplicate_within_24h') {
        Alert.alert('כבר דיווחת', 'דיווחת על הפוסט הזה ב-24 השעות האחרונות.');
        onClose();
      } else {
        Alert.alert('שגיאה', 'נסה שוב מאוחר יותר.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>דיווח על הפוסט</Text>
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
            placeholder="הערה (אופציונלי)"
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
              <Text style={styles.btnGhostText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={submit}
              disabled={submitting}
              accessibilityState={{ disabled: submitting }}
            >
              <Text style={styles.btnPrimaryText}>{submitting ? 'שולח...' : 'שלח דיווח'}</Text>
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
