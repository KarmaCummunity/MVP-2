// LocationDisplayLevelChooser — FR-POST-003 AC3.
// Three-option pill selector for how much of the address shows publicly.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { LocationDisplayLevel } from '@kc/domain';

interface Props {
  readonly value: LocationDisplayLevel;
  readonly onChange: (next: LocationDisplayLevel) => void;
  readonly disabled?: boolean;
}

const OPTIONS: { value: LocationDisplayLevel; label: string; hint: string }[] = [
  { value: 'CityOnly',      label: 'עיר בלבד',   hint: 'אנונימיות מרבית' },
  { value: 'CityAndStreet', label: 'עיר ורחוב',  hint: 'מומלץ' },
  { value: 'FullAddress',   label: 'כתובת מלאה', hint: 'כולל מספר בית' },
];

export function LocationDisplayLevelChooser({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>תצוגת הכתובת</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.btn, active && styles.btnActive, disabled && { opacity: 0.5 }]}
              onPress={() => !disabled && onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !!disabled }}
            >
              <Text style={[styles.btnLabel, active && styles.btnLabelActive]}>{opt.label}</Text>
              <Text style={[styles.btnHint, active && styles.btnHintActive]}>{opt.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.surface, gap: 2,
  },
  btnActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  btnLabel: { ...typography.label, color: colors.textSecondary },
  btnLabelActive: { color: colors.primary },
  btnHint: { ...typography.caption, color: colors.textDisabled },
  btnHintActive: { color: colors.primary },
});
