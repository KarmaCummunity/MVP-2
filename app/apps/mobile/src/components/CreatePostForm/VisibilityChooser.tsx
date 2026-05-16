import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';

interface Props {
  value: 'Public' | 'OnlyMe'; // FollowersOnly gated on Private profile (P2.4); excluded here.
  onChange: (next: 'Public' | 'OnlyMe') => void;
}

const ROW_KEYS: { v: 'Public' | 'OnlyMe'; labelKey: string; subKey: string }[] = [
  { v: 'Public', labelKey: 'post.visibilityPublic', subKey: 'post.visibilityPublicSub' },
  { v: 'OnlyMe', labelKey: 'post.visibilityOnlyMe', subKey: 'post.visibilityOnlyMeSub' },
];

export function VisibilityChooser({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('post.visibility')}</Text>
      {ROW_KEYS.map(({ v, labelKey, subKey }) => (
        <TouchableOpacity
          key={v}
          style={[styles.row, value === v && styles.rowActive]}
          onPress={() => onChange(v)}
        >
          <View style={[styles.radio, value === v && styles.radioActive]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t(labelKey)}</Text>
            <Text style={styles.sub}>{t(subKey)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  sub: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});
