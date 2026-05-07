import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

interface Props {
  value: 'Public' | 'OnlyMe'; // FollowersOnly gated on Private profile (P2.4); excluded here.
  onChange: (next: 'Public' | 'OnlyMe') => void;
}

const ROWS: { v: 'Public' | 'OnlyMe'; label: string; sub?: string }[] = [
  { v: 'Public', label: '🌍 כולם', sub: 'הפוסט יוצג בפיד הראשי לכל המשתמשים' },
  { v: 'OnlyMe', label: '🔒 רק אני', sub: 'הפוסט נשמר באופן פרטי; אפשר לפתוח לציבור בעריכה' },
];

export function VisibilityChooser({ value, onChange }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>מי יראה את הפוסט</Text>
      {ROWS.map(({ v, label, sub }) => (
        <TouchableOpacity
          key={v}
          style={[styles.row, value === v && styles.rowActive]}
          onPress={() => onChange(v)}
        >
          <View style={[styles.radio, value === v && styles.radioActive]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            {sub ? <Text style={styles.sub}>{sub}</Text> : null}
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
