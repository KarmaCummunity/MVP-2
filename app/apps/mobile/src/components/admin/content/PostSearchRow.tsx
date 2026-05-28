// app/apps/mobile/src/components/admin/content/PostSearchRow.tsx
// FR-ADMIN-019 — single row for the admin posts search.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AdminPostSearchResult } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import he from '../../../i18n/locales/he';

export interface PostSearchRowProps {
  readonly row: AdminPostSearchResult;
}

function statusTone(status: string): 'good' | 'warn' | 'bad' | 'muted' {
  if (status === 'open') return 'good';
  if (status === 'closed_delivered') return 'muted';
  if (status === 'removed_admin' || status === 'expired') return 'bad';
  return 'warn';
}

export function PostSearchRow({ row }: PostSearchRowProps) {
  const styles = useStyles();
  const tone = statusTone(row.status);
  return (
    <Pressable
      style={styles.root}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: row.postId } })}
    >
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={2}>
          {row.title ?? he.admin.content.untitled}
        </Text>
        <View style={styles.metaRow}>
          {row.ownerDisplayName && (
            <Text style={styles.meta} numberOfLines={1}>
              {he.admin.content.byOwner(row.ownerDisplayName)}
            </Text>
          )}
          <View style={[styles.chip, styles[`chip_${tone}` as const]]}>
            <Text style={styles.chipText}>
              {he.admin.content.postStatus[row.status as keyof typeof he.admin.content.postStatus]
                ?? row.status}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root: {
    paddingVertical: 12, paddingHorizontal: 16, gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  main:       { gap: 4 },
  title:      { fontSize: 14, fontWeight: '600' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta:       { fontSize: 11, opacity: 0.6, flex: 1 },
  chip:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chip_good:  { backgroundColor: colors.successLight },
  chip_warn:  { backgroundColor: colors.warningLight },
  chip_bad:   { backgroundColor: colors.errorLight },
  chip_muted: { backgroundColor: colors.border },
  chipText:   { fontSize: 11, fontWeight: '700' },
}));
