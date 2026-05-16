// Generic two-button confirmation modal used by post-detail ⋮ menu actions
// (delete-owner, admin-remove, block).
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** When true, the confirm button is rendered in destructive (red) style. */
  destructive?: boolean;
  isBusy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmActionModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  isBusy = false,
  errorMessage = null,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const cancelLabel = t('general.cancel');
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnSecondary, isBusy && styles.btnDisabled]}
              disabled={isBusy}
              onPress={onCancel}
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.btnSecondaryText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                destructive ? styles.btnDestructive : styles.btnPrimary,
                isBusy && styles.btnDisabled,
              ]}
              disabled={isBusy}
              onPress={onConfirm}
              accessibilityLabel={confirmLabel}
            >
              {isBusy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  message: { fontSize: 15, color: colors.textSecondary, textAlign: 'right', lineHeight: 22 },
  error: { fontSize: 13, color: colors.error, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnDestructive: { backgroundColor: colors.error },
  btnSecondary: { backgroundColor: colors.skeleton },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  btnSecondaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
