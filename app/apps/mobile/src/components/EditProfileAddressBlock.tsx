import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  city, onCityChange, street, streetNumber, onStreetChange, onStreetNumberChange, disabled,
}: EditProfileAddressBlockProps) {
  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>{t('profile.addressLabel')}</Text>
        <CityPicker value={city} onChange={onCityChange} disabled={disabled} />
      </View>
      <View style={styles.field}>
        <View style={styles.streetRow}>
          <TextInput
            style={[styles.input, styles.streetInputStreet]}
            value={street}
            onChangeText={onStreetChange}
            placeholder={t('profile.streetPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            maxLength={80}
            editable={!disabled}
          />
          <TextInput
            style={[styles.input, styles.streetInputHouse]}
            value={streetNumber}
            onChangeText={onStreetNumberChange}
            placeholder={t('profile.streetNumberPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            editable={!disabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  field: {
    marginVertical: spacing.xs,
     gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  streetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
    width: '100%',
  },
  streetInputStreet: { flex: 2, minWidth: 0 },
  streetInputHouse: { flex: 1, minWidth: 0, maxWidth: 120 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 48,
  },
});
