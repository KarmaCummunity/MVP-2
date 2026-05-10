// FR-CLOSURE-004 — one-time educational explainer with "don't show again".
import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@kc/ui';
import { useClosureStore } from '../../store/closureStore';
import { useAuthStore } from '../../store/authStore';
import { getUserRepo } from '../../services/userComposition';

export function ClosureExplainerSheet() {
  const step = useClosureStore((s) => s.step);
  const dismiss = useClosureStore((s) => s.dismissExplainer);
  const reset = useClosureStore((s) => s.reset);
  const userId = useAuthStore((s) => s.session?.userId);
  const [stayDismissed, setStayDismissed] = useState(false);
  const [alreadyDismissed, setAlreadyDismissed] = useState<boolean | null>(null);

  // Check the persistent flag once when the explainer step is reached.
  useEffect(() => {
    if (step !== 'explainer' || !userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const u = await getUserRepo().findById(userId);
        if (!cancelled) setAlreadyDismissed(u?.closureExplainerDismissed === true);
      } catch {
        if (!cancelled) setAlreadyDismissed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, userId]);

  // Already dismissed forever — fast-forward to done without rendering.
  useEffect(() => {
    if (step === 'explainer' && alreadyDismissed === true) {
      reset();
    }
  }, [step, alreadyDismissed, reset]);

  const visible = step === 'explainer' && alreadyDismissed === false;

  if (!userId) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
      <Pressable style={styles.backdrop} onPress={reset}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>✨  תודה שתרמת!</Text>
          <Text style={styles.body}>כך זה עובד:</Text>
          <Text style={styles.bullet}>
            • פוסטים שסומנו עם מקבל — נשמרים לתמיד ומופיעים בסטטיסטיקה שלך ושל המקבל.
          </Text>
          <Text style={styles.bullet}>
            • פוסטים שנסגרו בלי לסמן — נשמרים 7 ימים למקרה של טעות, ואז נמחקים אוטומטית.
          </Text>
          <Text style={styles.bullet}>• בכל מקרה — &quot;פריטים שתרמתי&quot; שלך עולה ב-1.</Text>

          <Pressable
            onPress={() => setStayDismissed((v) => !v)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, stayDismissed && styles.checkboxChecked]}>
              {stayDismissed ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>אל תציג שוב</Text>
          </Pressable>

          <Pressable
            onPress={() => dismiss(stayDismissed, userId)}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Text style={styles.btnPrimaryText}>הבנתי</Text>
          </Pressable>
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
  body: { fontSize: 15, color: colors.textSecondary, textAlign: 'right', marginBottom: 8 },
  bullet: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.textInverse, fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 14, color: colors.textPrimary },
  btn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
});
