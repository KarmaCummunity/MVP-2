// FR-CLOSURE-005 AC2 — confirmation modal for reopening a closed post.
// Copy varies on TWO axes:
//   1. status:  closed_delivered (with consequences) vs deleted_no_recipient (cancel cleanup)
//   2. type:    Give (owner gave / marked received) vs Request (owner received / marked gave)
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@kc/ui';
import type { PostType } from '@kc/domain';

interface Props {
  visible: boolean;
  variant: 'closed_delivered' | 'deleted_no_recipient';
  postType: PostType;
  isBusy: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReopenConfirmModal({
  visible,
  variant,
  postType,
  isBusy,
  errorMessage,
  onCancel,
  onConfirm,
}: Props) {
  const give = postType === 'Give';
  // Marked-user direction: Give → "מי שקיבל"; Request → "מי שמסר".
  const markedSideLabel = give ? 'מי שקיבל' : 'מי שמסר לך';
  // Counters from the user's mental model — see RecipientCallout for the same
  // convention. The DB columns lag this naming for Request posts (TD pending).
  const ownerCounter = give ? 'פריטים שתרמתי' : 'פריטים שקיבלתי';
  const markedCounter = give ? 'פריטים שקיבלתי' : 'פריטים שתרמתי';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>📤  לפתוח את הפוסט מחדש?</Text>
          {variant === 'closed_delivered' ? (
            <View>
              <Text style={styles.body}>הפוסט יחזור להיות פעיל בפיד.</Text>
              <Text style={styles.bullet}>• הסימון של {markedSideLabel} יוסר.</Text>
              <Text style={styles.bullet}>
                • &quot;{markedCounter}&quot; שלו יקטן ב-1 (בלי התראה).
              </Text>
              <Text style={styles.bullet}>• &quot;{ownerCounter}&quot; שלך יקטן ב-1.</Text>
            </View>
          ) : (
            <Text style={styles.body}>הפוסט יחזור להיות פעיל בפיד והוא לא יימחק.</Text>
          )}

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <View style={styles.actions}>
            <Pressable onPress={onCancel} disabled={isBusy} style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnSecondaryText}>ביטול</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isBusy}
              style={[styles.btn, styles.btnPrimary, isBusy && styles.btnDisabled]}
            >
              {isBusy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.btnPrimaryText}>פתח מחדש</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 440,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 12, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary, textAlign: 'right', marginBottom: 8 },
  bullet: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'right',
    marginTop: 8,
  },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 16 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  btnSecondary: { backgroundColor: colors.skeleton },
  btnSecondaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
