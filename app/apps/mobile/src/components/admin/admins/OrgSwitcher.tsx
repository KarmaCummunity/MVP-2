// app/apps/mobile/src/components/admin/admins/OrgSwitcher.tsx
// FR-ADMIN-025 — org filter for the hierarchy tree. super_admin can switch
// between orgs (or view all); scoped admins are pinned to their org upstream.
import { ScrollView, Pressable, Text } from 'react-native';
import { makeUseStyles } from '@kc/ui';
import { rowDirectionStart } from '../../../lib/rtlLayout';
import he from '../../../i18n/locales/he';

export interface OrgOption {
  readonly id: string;
  readonly name: string;
}

export interface OrgSwitcherProps {
  readonly orgs: readonly OrgOption[];
  readonly selected: string | null;
  readonly onSelect: (orgId: string | null) => void;
}

export function OrgSwitcher({ orgs, selected, onSelect }: OrgSwitcherProps) {
  const styles = useStyles();
  const chip = (id: string | null, label: string) => (
    <Pressable
      key={id ?? 'all'}
      accessibilityRole="button"
      onPress={() => onSelect(id)}
      style={[styles.chip, selected === id && styles.chipActive]}
    >
      <Text style={[styles.chipText, selected === id && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
    >
      {chip(null, he.admin.admins.tree.orgAll)}
      {orgs.map((o) => chip(o.id, o.name))}
    </ScrollView>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  bar: { flexDirection: rowDirectionStart, gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
}));
