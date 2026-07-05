// app/apps/mobile/src/components/admin/admins/ManagerSummary.tsx
// FR-ADMIN-025 — read-only display of a grant's direct manager + subordinates
// (+ any mutation error). Presentational; mutation lives in GrantManagerSection.
import { Text, View } from 'react-native';
import type { OrgTreeMember } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import { textAlignStart } from '../../../lib/rtlLayout';
import he from '../../../i18n/locales/he';

export interface ManagerSummaryProps {
  readonly managerName: string | null;
  readonly subordinates: readonly OrgTreeMember[];
  readonly errCode: string | null;
}

function errorText(code: string): string {
  const map = he.admin.admins.managerErrors;
  return map[code as keyof typeof map] ?? map.unknown;
}

export function ManagerSummary({ managerName, subordinates, errCode }: ManagerSummaryProps) {
  const styles = useStyles();
  const unnamed = he.admin.admins.row.unnamed;
  return (
    <View>
      <Text style={styles.label}>{he.admin.admins.detail.managerSection}</Text>
      <Text style={styles.value}>{managerName ?? he.admin.admins.detail.managerNone}</Text>

      <Text style={styles.label}>{he.admin.admins.detail.subordinatesSection}</Text>
      {subordinates.length === 0 ? (
        <Text style={styles.value}>{he.admin.admins.detail.subordinatesNone}</Text>
      ) : (
        subordinates.map((s) => (
          <Text key={s.grantId} style={styles.value}>• {s.displayName ?? unnamed}</Text>
        ))
      )}

      {errCode !== null && <Text style={styles.error}>{errorText(errCode)}</Text>}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  label: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginTop: 6, textAlign: textAlignStart() },
  value: { fontSize: 14, color: colors.textPrimary, textAlign: textAlignStart() },
  error: { fontSize: 12, color: '#7f1d1d', marginTop: 6, textAlign: textAlignStart() },
}));
