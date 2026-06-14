// FR-ADMIN-021 — assign an active user to the board / audit committee.
// Lookup mirrors GrantRoleModal (admin SELECT on active users).
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import type { GovernanceRole } from '@kc/domain';
import { isOrgFormationError } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { supabase } from '../../../lib/container';
import he from '../../../i18n/locales/he';

interface UserMatch {
  readonly user_id: string;
  readonly display_name: string | null;
}

async function lookupUsers(q: string): Promise<readonly UserMatch[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const { data, error } = await supabase
    .from('users')
    .select('user_id, display_name')
    .eq('account_status', 'active')
    .ilike('display_name', `%${trimmed}%`)
    .limit(8);
  if (error || !Array.isArray(data)) return [];
  return data as UserMatch[];
}

interface Props {
  readonly governanceRole: GovernanceRole;
  readonly onClose: () => void;
  readonly onAssign: (userId: string) => Promise<void>;
}

export function AssignMemberModal({ governanceRole, onClose, onAssign }: Props) {
  const styles = useStyles();
  const t = he.admin.orgFormation.assignModal;
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<readonly UserMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserMatch | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selected) return;
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const r = await lookupUsers(query);
      if (!cancelled) { setMatches(r); setLoading(false); }
    }, 280);
    return () => { cancelled = true; clearTimeout(handle); setLoading(false); };
  }, [query, selected]);

  async function submit() {
    if (!selected) return;
    setErrorCode(null);
    setSubmitting(true);
    try {
      await onAssign(selected.user_id);
      onClose();
    } catch (e) {
      setErrorCode(isOrgFormationError(e) ? e.code : 'unknown');
    } finally {
      setSubmitting(false);
    }
  }

  const errors = he.admin.orgFormation.errors;
  const title = governanceRole === 'board_member' ? t.titleBoard : t.titleAudit;
  const canSubmit = selected !== null && !submitting;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.label}>{t.searchLabel}</Text>
          {selected ? (
            <View style={styles.selectedRow}>
              <Text style={styles.selectedName} numberOfLines={1}>
                {selected.display_name ?? he.admin.orgFormation.governance.unnamed}
              </Text>
              <Pressable onPress={() => { setSelected(null); setQuery(''); }}>
                <Text style={styles.changeLink}>{t.changeUser}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder={t.searchPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
              {!loading && query.trim().length >= 2 && matches.length === 0 && (
                <Text style={styles.hint}>{t.noMatches}</Text>
              )}
              {matches.map((m) => (
                <Pressable key={m.user_id} style={styles.matchRow} onPress={() => setSelected(m)}>
                  <Text style={styles.matchName} numberOfLines={1}>
                    {m.display_name ?? he.admin.orgFormation.governance.unnamed}
                  </Text>
                </Pressable>
              ))}
            </>
          )}

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
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              disabled={!canSubmit}
              onPress={() => { void submit(); }}
            >
              <Text style={styles.submitBtnText}>{t.submit}</Text>
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
  label: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 8,
    padding: 10, fontSize: 14, textAlign: 'right',
  },
  selectedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.secondaryLight, borderRadius: 8,
  },
  selectedName: { fontSize: 14, fontWeight: '600', flex: 1 },
  changeLink: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  hint: { fontSize: 12, opacity: 0.6, marginTop: 6, textAlign: 'center' },
  matchRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  matchName: { fontSize: 14 },
  errorText: { fontSize: 12, color: colors.error, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '500' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: colors.textInverse },
}));
