/** CityPicker: `public.cities` modal per FR-AUTH-010 AC2; searchable list. */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, radius } from '@kc/ui';
import type { City } from '@kc/domain';
import { listCities } from '../services/userComposition';

interface Props {
  readonly value: { id: string; name: string } | null;
  readonly onChange: (selection: { id: string; name: string }) => void;
  readonly disabled?: boolean;
}
export function CityPicker({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  const { data: cities, isLoading, error } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 1000 * 60 * 60, // 1h — cities rarely change
  });

  const filtered = useMemo(() => {
    if (!cities) return [];
    const q = query.trim();
    if (!q) return cities;
    return cities.filter((c) => c.nameHe.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase()));
  }, [cities, query]);

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
            !value && { color: colors.textDisabled },
          ]}
        >
          {value ? value.name : 'בחר עיר'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdropPressable}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="סגור"
          />
          <View style={styles.sheetOuter} pointerEvents="box-none">
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>בחר עיר</Text>
              <TextInput
                ref={searchInputRef}
                style={styles.search}
                placeholder="...חיפוש עיר"
                placeholderTextColor={colors.textDisabled}
                value={query}
                onChangeText={setQuery}
                textAlign="right"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isLoading && (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
              {error && (
                <Text style={styles.errorText}>שגיאה בטעינת רשימת הערים. נסה שוב.</Text>
              )}
              {!isLoading && !error && (
                <FlatList
                  data={filtered}
                  keyExtractor={(c) => c.cityId}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>לא נמצאו ערים תואמות.</Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => {
                        onChange({ id: item.cityId, name: item.nameHe });
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      <Text style={styles.rowText}>{item.nameHe}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </View>
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
  modalRoot: {
    flex: 1,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetOuter: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  search: {
    minHeight: 44,
    textAlign: 'right',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  statusRow: { paddingVertical: spacing.lg, alignItems: 'center' },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
});
