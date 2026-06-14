// FR-ADMIN-021 — board (vaad) + audit committee (vaadat bikoret) rosters.
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GovernanceAssignment, GovernanceRole } from '@kc/domain';
import { makeUseStyles, useTheme } from '@kc/ui';
import he from '../../../i18n/locales/he';

interface Props {
  readonly assignments: readonly GovernanceAssignment[];
  readonly canManage: boolean;
  readonly onAdd: (role: GovernanceRole) => void;
  readonly onRemove: (assignment: GovernanceAssignment) => void;
}

export function GovernanceSection({ assignments, canManage, onAdd, onRemove }: Props) {
  const styles = useStyles();
  const t = he.admin.orgFormation.governance;
  const board = assignments.filter((a) => a.governanceRole === 'board_member');
  const audit = assignments.filter((a) => a.governanceRole === 'audit_member');

  return (
    <View style={styles.root}>
      <Text style={styles.sectionTitle}>{t.sectionTitle}</Text>
      <Text style={styles.note}>{t.assignsRole}</Text>
      <RosterList
        title={t.boardTitle} rows={board} canManage={canManage}
        addLabel={t.addBoard} onAdd={() => onAdd('board_member')} onRemove={onRemove}
      />
      <RosterList
        title={t.auditTitle} rows={audit} canManage={canManage}
        addLabel={t.addAudit} onAdd={() => onAdd('audit_member')} onRemove={onRemove}
      />
    </View>
  );
}

interface RosterProps {
  readonly title: string;
  readonly rows: readonly GovernanceAssignment[];
  readonly canManage: boolean;
  readonly addLabel: string;
  readonly onAdd: () => void;
  readonly onRemove: (assignment: GovernanceAssignment) => void;
}

function RosterList({ title, rows, canManage, addLabel, onAdd, onRemove }: RosterProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = he.admin.orgFormation.governance;
  return (
    <View style={styles.roster}>
      <View style={styles.rosterHeader}>
        <Text style={styles.rosterTitle}>{title} ({rows.length})</Text>
        {canManage && (
          <Pressable accessibilityRole="button" onPress={onAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{addLabel}</Text>
          </Pressable>
        )}
      </View>
      {rows.length === 0 && <Text style={styles.empty}>{t.empty}</Text>}
      {rows.map((a) => (
        <View key={a.assignmentId} style={styles.memberRow}>
          <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.memberName} numberOfLines={1}>
            {a.displayName ?? t.unnamed}
          </Text>
          {canManage && (
            <Pressable accessibilityRole="button" onPress={() => onRemove(a)} hitSlop={8}>
              <Text style={styles.removeText}>{t.removeShort}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root: { marginHorizontal: 16, marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  note: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  roster: {
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, padding: 12, gap: 8,
  },
  rosterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rosterTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  addBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primary },
  addBtnText: { fontSize: 12, fontWeight: '700', color: colors.textInverse },
  empty: { fontSize: 12, opacity: 0.6, paddingVertical: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { flex: 1, fontSize: 14, color: colors.textPrimary },
  removeText: { fontSize: 12, fontWeight: '600', color: colors.error },
}));
