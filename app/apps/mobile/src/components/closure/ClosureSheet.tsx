// FR-CLOSURE-002 + FR-CLOSURE-003 — hybrid Step 1 + Step 2 bottom sheet.
// Step 1 (confirm) and Step 2 (recipient picker) live inside the same
// modal because they're a single transactional flow; Step 3 (the
// one-time educational note) is a separate sheet.
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '@kc/ui';
import type { ClosureCandidate } from '@kc/application';
import { useClosureStore } from '../../store/closureStore';
import { useAuthStore } from '../../store/authStore';
import { RecipientPickerRow } from './RecipientPickerRow';
import { ClosureErrorPane } from './ClosureErrorPane';

export function ClosureSheet() {
  const step = useClosureStore((s) => s.step);
  const candidates = useClosureStore((s) => s.candidates);
  const selectedId = useClosureStore((s) => s.selectedRecipientId);
  const isBusy = useClosureStore((s) => s.isBusy);
  const errorMessage = useClosureStore((s) => s.errorMessage);
  const confirmStep1 = useClosureStore((s) => s.confirmStep1);
  const selectRecipient = useClosureStore((s) => s.selectRecipient);
  const closeWith = useClosureStore((s) => s.closeWith);
  const reset = useClosureStore((s) => s.reset);
  const ownerId = useAuthStore((s) => s.session?.userId);

  // step='error' is shown so the user sees feedback instead of a faded button
  // with nothing happening (the original bug report).
  const visible = step === 'confirm' || step === 'pick' || step === 'error';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <Pressable style={styles.backdrop} onPress={reset}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {step === 'confirm' ? (
            <Step1 onConfirm={confirmStep1} onCancel={reset} isBusy={isBusy} />
          ) : null}
          {step === 'pick' && ownerId ? (
            <Step2
              candidates={candidates}
              selectedId={selectedId}
              isBusy={isBusy}
              errorMessage={errorMessage}
              onSelect={selectRecipient}
              onMarkAndClose={() => selectedId && closeWith(selectedId, ownerId)}
              onCloseWithoutMarking={() => closeWith(null, ownerId)}
              onCancel={reset}
            />
          ) : null}
          {step === 'error' ? (
            <ClosureErrorPane errorMessage={errorMessage} onClose={reset} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Step1({
  onConfirm,
  onCancel,
  isBusy,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isBusy: boolean;
}) {
  return (
    <View>
      <Text style={styles.title}>🤝  האם הפריט באמת נמסר?</Text>
      <Text style={styles.body}>
        חשוב לסמן רק אחרי המסירה הפיזית — לא אחרי תיאום בצ&apos;אט. אם הפריט עדיין לא הגיע ליד מקבל, אל תסמן.
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={[styles.btn, styles.btnSecondary]}>
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
            <Text style={styles.btnPrimaryText}>כן, נמסר ✓</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface Step2Props {
  candidates: ClosureCandidate[];
  selectedId: string | null;
  isBusy: boolean;
  errorMessage: string | null;
  onSelect: (id: string | null) => void;
  onMarkAndClose: () => void;
  onCloseWithoutMarking: () => void;
  onCancel: () => void;
}

function Step2({
  candidates,
  selectedId,
  isBusy,
  errorMessage,
  onSelect,
  onMarkAndClose,
  onCloseWithoutMarking,
  onCancel,
}: Step2Props) {
  if (candidates.length === 0) {
    return (
      <View>
        <Text style={styles.title}>🎁  אין למי לסמן</Text>
        <Text style={styles.body}>
          עדיין לא היה צ&apos;אט על הפוסט הזה. אפשר לסגור בלי לסמן מקבל; הפוסט יישמר 7 ימים למקרה שטעית, ואז יימחק אוטומטית.
        </Text>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <View style={styles.actions}>
          <Pressable onPress={onCancel} disabled={isBusy} style={[styles.btn, styles.btnSecondary]}>
            <Text style={styles.btnSecondaryText}>ביטול</Text>
          </Pressable>
          <Pressable
            onPress={onCloseWithoutMarking}
            disabled={isBusy}
            style={[styles.btn, styles.btnPrimary, isBusy && styles.btnDisabled]}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnPrimaryText}>סגור בלי לסמן</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>🎁  למי מסרת את הפריט?</Text>
      <Text style={styles.body}>
        בחר את האדם שקיבל מתוך מי שהיה איתך בצ&apos;אט על הפוסט הזה. אם המקבל לא היה בצ&apos;אט — אפשר לסגור בלי לסמן.
      </Text>
      <ScrollView style={styles.list}>
        {candidates.map((c) => (
          <RecipientPickerRow
            key={c.userId}
            candidate={c}
            selected={c.userId === selectedId}
            onPress={() => onSelect(c.userId)}
          />
        ))}
      </ScrollView>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.actions}>
        <Pressable
          onPress={onCloseWithoutMarking}
          disabled={isBusy}
          style={[styles.btn, styles.btnSecondary, isBusy && styles.btnDisabled]}
        >
          <Text style={styles.btnSecondaryText}>סגור בלי לסמן</Text>
        </Pressable>
        <Pressable
          onPress={onMarkAndClose}
          disabled={!selectedId || isBusy}
          style={[styles.btn, styles.btnPrimary, (!selectedId || isBusy) && styles.btnDisabled]}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.btnPrimaryText}>סמן וסגור ✓</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 8, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textSecondary, textAlign: 'right', marginBottom: 16, lineHeight: 22 },
  list: { maxHeight: 280, marginBottom: 8 },
  error: { fontSize: 14, color: colors.error, textAlign: 'right', marginBottom: 8 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  btnSecondary: { backgroundColor: colors.skeleton },
  btnSecondaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
