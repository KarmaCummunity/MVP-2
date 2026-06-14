// FR-ADMIN-021 — super_admin edits a step's body + tips (editable content).
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { FormationStep } from '@kc/domain';
import { isOrgFormationError } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import he from '../../../i18n/locales/he';

interface Props {
  readonly step: FormationStep;
  readonly onClose: () => void;
  readonly onSave: (bodyText: string, tips: readonly string[]) => Promise<void>;
}

export function StepContentEditModal({ step, onClose, onSave }: Props) {
  const styles = useStyles();
  const t = he.admin.orgFormation.editModal;
  const errors = he.admin.orgFormation.errors;
  const [body, setBody] = useState(step.bodyText);
  const [tipsText, setTipsText] = useState(step.tips.join('\n'));
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    setErrorCode(null);
    setSubmitting(true);
    const tips = tipsText.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
    try {
      await onSave(body, tips);
      onClose();
    } catch (e) {
      setErrorCode(isOrgFormationError(e) ? e.code : 'unknown');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.title}</Text>

          <Text style={styles.label}>{t.bodyLabel}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={body}
            onChangeText={setBody}
            multiline
          />

          <Text style={styles.label}>{t.tipsLabel}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={tipsText}
            onChangeText={setTipsText}
            multiline
          />

          {errorCode !== null && (
            <Text style={styles.errorText}>
              {errors[errorCode as keyof typeof errors] ?? errors.unknown}
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t.cancel}</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              disabled={submitting}
              onPress={() => { void save(); }}
            >
              <Text style={styles.submitBtnText}>{t.save}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 6, maxHeight: '85%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  label: { fontSize: 12, opacity: 0.7, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 8,
    padding: 10, fontSize: 14, textAlign: 'right', color: colors.textPrimary,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: colors.error, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '500' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: colors.textInverse },
}));
