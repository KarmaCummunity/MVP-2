// FR-MOD-007 — Report modal opened from a user profile's overflow menu.
// Mirrors ReportPostModal but submits to container.reportUser (target_type='user').
import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import type { ReportReason } from '@kc/domain';
import { container } from '../../lib/container';
import { useAuthStore } from '../../store/authStore';
import { makeUseStyles, useTheme } from '@kc/ui';
import he from '../../i18n/locales/he';
import { rowDirectionStart } from '../../lib/rtlLayout';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { NotifyModal } from '../NotifyModal';
import { useReportForm } from '../report/useReportForm';

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
  const styles = useStyles();
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.session?.userId);
  const { reason, setReason, note, setNote, submitting, notify, setNotify, runSubmit } =
    useReportForm(visible);

  const submit = () => {
    if (!userId) return;
    void runSubmit(
      (r, n) => container.reportUser.execute({ reporterId: userId, targetUserId, reason: r, note: n || undefined }),
      onClose,
      {
        success: { title: t.report.user.successTitle, message: t.report.user.successToast },
        duplicate: { title: t.report.user.duplicateTitle, message: t.report.user.duplicateError },
        alreadyModerated: { title: t.report.user.alreadyModeratedTitle, message: t.report.user.alreadyModeratedError },
        error: { title: t.report.user.errorTitle, message: t.actions.errors.networkError },
      },
    );
  };

  return (
    <>
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
    <NotifyModal visible={notify !== null} title={notify?.title ?? ''} message={notify?.message ?? ''} onDismiss={() => setNotify(null)} />
    </>
  );
}

const useStyles = makeUseStyles(({ colors, isDark }) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, padding: 16, gap: 8,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, textAlign: rtlTextAlignStart, marginBottom: 4 },
  label: { fontSize: 13, color: colors.textSecondary, textAlign: rtlTextAlignStart },
  reasonRow: {
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  reasonRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  reasonText: { fontSize: 15, color: colors.textPrimary, textAlign: rtlTextAlignStart },
  note: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, minHeight: 80, fontSize: 15, color: colors.textPrimary,
  },
  actions: { flexDirection: rowDirectionStart, gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  btnGhostText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
}));
