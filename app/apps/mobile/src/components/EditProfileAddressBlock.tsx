// FR-PROFILE-007 — city (required) + optional street / number (same shape as create-post address).
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import { CityPicker } from './CityPicker';

export interface EditProfileAddressBlockProps {
  city: { id: string; name: string } | null;
  onCityChange: (v: { id: string; name: string } | null) => void;
  street: string;
  streetNumber: string;
  onStreetChange: (v: string) => void;
  onStreetNumberChange: (v: string) => void;
  disabled: boolean;
}

export function EditProfileAddressBlock({
  city, onCityChange, street, streetNumber, onStreetChange, onStreetNumberChange, disabled,
}: EditProfileAddressBlockProps) {
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>עיר</Text>
        <CityPicker value={city} onChange={onCityChange} disabled={disabled} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>רחוב ומספר (אופציונלי)</Text>
        <View style={styles.streetRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            value={street}
            onChangeText={onStreetChange}
            placeholder="רחוב"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            maxLength={80}
            editable={!disabled}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={streetNumber}
            onChangeText={onStreetNumberChange}
            placeholder="מס׳"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            editable={!disabled}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  streetRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 48,
  },
});
