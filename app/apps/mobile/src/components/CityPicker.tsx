// ─────────────────────────────────────────────
// CityPicker — modal selector for IL_CITIES.
// FR-AUTH-010 AC2: city is a dropdown of the canonical Israeli city list; no free text.
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { IL_CITIES, findCityById } from '@kc/domain';
import { colors, typography, spacing, radius } from '@kc/ui';

interface Props {
  readonly value: string | null;
  readonly onChange: (cityId: string) => void;
  readonly disabled?: boolean;
}

export function CityPicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? findCityById(value) : undefined;

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="בחר עיר"
      >
        <Text
          style={[
            styles.value,
            !selected && { color: colors.textDisabled },
          ]}
        >
          {selected ? selected.nameHe : 'בחר עיר'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>בחר עיר</Text>
            <FlatList
              data={IL_CITIES}
              keyExtractor={(c) => c.cityId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onChange(item.cityId);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowText}>{item.nameHe}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  value: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.base,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
});
