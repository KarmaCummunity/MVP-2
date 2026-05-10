// FR-CLOSURE-003 — recipient picker (Step 2 of the closure sheet).
// Two modes:
//   1. 'chats'  — chat partners loaded by start() (default)
//   2. 'search' — TextInput + debounced search across ALL users
//
// Four user-facing actions (per product brief 2026-05-10):
//   1. Cancel → reset()
//   2. Close without marking → closeWith(null)
//   3. Pick a chat partner → toggle 'chats' mode + select + Mark and Close
//   4. Pick from any user (with search) → toggle 'search' mode + select + Mark and Close
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@kc/ui';
import type { PostType } from '@kc/domain';
import { useClosureStore } from '../../store/closureStore';
import { ChatsPane, ModeTabs, SearchPane } from './ClosureRecipientPanes';

interface Props {
  ownerId: string;
  postType: PostType;
  isBusy: boolean;
  errorMessage: string | null;
  onMarkAndClose: () => void;
  onCloseWithoutMarking: () => void;
  onCancel: () => void;
}

export function ClosureStep2({
  ownerId,
  postType,
  isBusy,
  errorMessage,
  onMarkAndClose,
  onCloseWithoutMarking,
  onCancel,
}: Props) {
  const pickMode = useClosureStore((s) => s.pickMode);
  const candidates = useClosureStore((s) => s.candidates);
  const searchResults = useClosureStore((s) => s.searchResults);
  const searchQuery = useClosureStore((s) => s.searchQuery);
  const isSearching = useClosureStore((s) => s.isSearching);
  const selectedId = useClosureStore((s) => s.selectedRecipientId);
  const setPickMode = useClosureStore((s) => s.setPickMode);
  const setSearchQuery = useClosureStore((s) => s.setSearchQuery);
  const selectRecipient = useClosureStore((s) => s.selectRecipient);

  const showNoResultsHint =
    pickMode === 'search' &&
    searchQuery.length >= 2 &&
    !isSearching &&
    searchResults.length === 0;

  const give = postType === 'Give';
  const title = give ? '🎁  למי מסרת את הפריט?' : '🎁  ממי קיבלת את הפריט?';

  return (
    <View>
      <Text style={styles.title}>{title}</Text>

      <ModeTabs pickMode={pickMode} chatsCount={candidates.length} onChange={setPickMode} />

      {pickMode === 'chats' ? (
        <ChatsPane candidates={candidates} selectedId={selectedId} onSelect={selectRecipient} />
      ) : (
        <SearchPane
          query={searchQuery}
          onQueryChange={(q) => setSearchQuery(q, ownerId)}
          results={searchResults}
          isSearching={isSearching}
          selectedId={selectedId}
          onSelect={selectRecipient}
        />
      )}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          disabled={isBusy}
          style={[styles.btn, styles.btnGhost, isBusy && styles.btnDisabled]}
        >
          <Text style={styles.btnGhostText}>ביטול</Text>
        </Pressable>
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
      {showNoResultsHint ? <Text style={styles.helper}>לא נמצא משתמש בשם כזה.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 12, color: colors.textPrimary },
  helper: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  error: { fontSize: 14, color: colors.error, textAlign: 'right', marginBottom: 8 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  btnSecondary: { backgroundColor: colors.skeleton },
  btnSecondaryText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  btnDisabled: { opacity: 0.5 },
});
