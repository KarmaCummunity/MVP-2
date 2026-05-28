// app/apps/mobile/src/components/admin/content/UserSearchRow.tsx
// FR-ADMIN-019 — single row for the admin users search.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AdminUserSearchResult } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import he from '../../../i18n/locales/he';

export interface UserSearchRowProps {
  readonly row: AdminUserSearchResult;
}

function statusTone(status: string): 'good' | 'warn' | 'bad' | 'muted' {
  if (status === 'active') return 'good';
  if (status === 'pending_verification') return 'warn';
  if (status === 'banned' || status === 'deleted') return 'bad';
  return 'muted';
}

export function UserSearchRow({ row }: UserSearchRowProps) {
  const styles = useStyles();
  const tone = statusTone(row.accountStatus);
  return (
    <Pressable
      style={styles.root}
      onPress={() => {
        if (row.shareHandle) {
          router.push({ pathname: '/user/[handle]', params: { handle: row.shareHandle } });
        }
      }}
    >
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {row.displayName ?? he.admin.admins.row.unnamed}
        </Text>
        {row.shareHandle && <Text style={styles.handle} numberOfLines={1}>@{row.shareHandle}</Text>}
        {row.cityName && <Text style={styles.meta} numberOfLines={1}>{row.cityName}</Text>}
      </View>
      <View style={[styles.chip, styles[`chip_${tone}` as const]]}>
        <Text style={styles.chipText}>
          {he.admin.content.userStatus[row.accountStatus as keyof typeof he.admin.content.userStatus]
            ?? row.accountStatus}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  main:        { flex: 1, gap: 2 },
  name:        { fontSize: 15, fontWeight: '600' },
  handle:      { fontSize: 12, color: colors.primary },
  meta:        { fontSize: 11, opacity: 0.55 },
  chip:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chip_good:   { backgroundColor: colors.successLight },
  chip_warn:   { backgroundColor: colors.warningLight },
  chip_bad:    { backgroundColor: colors.errorLight },
  chip_muted:  { backgroundColor: colors.border },
  chipText:    { fontSize: 11, fontWeight: '700' },
}));
