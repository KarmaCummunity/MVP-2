import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RADIUS_OPTIONS_KM, type LocationFilter } from '@kc/domain';
import { colors, radius, spacing, typography } from '@kc/ui';
import { CityPicker } from '../CityPicker';

interface LocationFilterSectionProps {
  value: LocationFilter | null;
  onChange: (next: LocationFilter | null) => void;
}

const DEFAULT_RADIUS_KM = 5;

export function LocationFilterSection({ value, onChange }: LocationFilterSectionProps) {
  const cityValue = value ? { id: value.centerCity, name: value.centerCityName } : null;
  const radiusKm = value?.radiusKm ?? DEFAULT_RADIUS_KM;

  const handleCity = (selection: { id: string; name: string } | null) => {
    if (!selection) {
      onChange(null);
      return;
    }
    onChange({
      centerCity: selection.id,
      centerCityName: selection.name,
      radiusKm,
    });
  };

  const handleRadius = (km: number) => {
    if (!value) return;
    onChange({ ...value, radiusKm: km });
  };

  const handleClearAllCities = () => onChange(null);

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        {value && (
          <Pressable onPress={handleClearAllCities} hitSlop={8}>
            <Text style={styles.clearText}>כל הערים</Text>
          </Pressable>
        )}
        <Text style={styles.title}>מיקום</Text>
      </View>
      <CityPicker value={cityValue} onChange={handleCity} />
      {value && (
        <>
          <Text style={styles.subLabel}>טווח</Text>
          <View style={styles.row}>
            {RADIUS_OPTIONS_KM.map((km) => (
              <RadiusChip key={km} km={km} active={radiusKm === km} onPress={() => handleRadius(km)} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function RadiusChip({ km, active, onPress }: { km: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[radiusStyles.chip, active && radiusStyles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[radiusStyles.text, active && radiusStyles.textActive]}>{km} ק"מ</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  subLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  clearText: { ...typography.caption, color: colors.primary, fontWeight: '500' as const },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
});

const radiusStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: colors.secondary },
  text: { ...typography.caption, fontWeight: '600' as const, color: colors.textPrimary },
  textActive: { color: colors.textInverse },
});
