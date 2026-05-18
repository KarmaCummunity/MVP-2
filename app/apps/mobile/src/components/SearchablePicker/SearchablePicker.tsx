// Generic searchable modal picker. Used by CityPicker + StreetPicker so the
// two surfaces are guaranteed visually + behaviorally identical (PM
// requirement 2026-05-18). All non-trivial logic lives in
// `searchablePickerLogic.ts` (unit tested); the component is the JSX shell.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import {
  filterItems,
  freeTextSelection,
  shouldShowFreeTextRow,
  type SearchablePickerItemDescriptor,
} from './searchablePickerLogic';

export interface SearchablePickerProps<T> {
  readonly title: string;
  readonly placeholder: string;
  readonly value: SearchablePickerItemDescriptor | null;
  readonly items: readonly T[] | null;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly disabled?: boolean;
  readonly disabledHelperText?: string;
  readonly onDisabledPress?: () => void;
  readonly onSelect: (selection: SearchablePickerItemDescriptor) => void;
  readonly matchItem: (item: T, query: string) => boolean;
  readonly renderRow: (item: T) => SearchablePickerItemDescriptor;
  readonly allowFreeText?: boolean;
  readonly emptyText?: string;
  readonly errorText?: string;
}

export function SearchablePicker<T>(props: SearchablePickerProps<T>) {
  const {
    title,
    placeholder,
    value,
    items,
    isLoading,
    error,
    disabled,
    disabledHelperText,
    onDisabledPress,
    onSelect,
    matchItem,
    renderRow,
    allowFreeText,
    emptyText,
    errorText,
  } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open]);

  const filtered = useMemo<readonly T[]>(
    () => filterItems(items, query, matchItem),
    [items, query, matchItem],
  );

  const showFreeTextRow = useMemo(
    () => shouldShowFreeTextRow({ allowFreeText, query, items, renderRow }),
    [allowFreeText, query, items, renderRow],
  );

  const handleFieldPress = useCallback(() => {
    if (disabled) {
      onDisabledPress?.();
      return;
    }
    setOpen(true);
  }, [disabled, onDisabledPress]);

  const handleRowPress = useCallback(
    (selection: SearchablePickerItemDescriptor) => {
      onSelect(selection);
      setOpen(false);
      setQuery('');
    },
    [onSelect],
  );

  const handleFreeTextPress = useCallback(() => {
    handleRowPress(freeTextSelection(query));
  }, [handleRowPress, query]);

  const resolvedEmptyText = emptyText ?? t('profile.cityPickerEmpty');
  const resolvedErrorText = errorText ?? t('profile.cityPickerError');
  const trimmedQuery = query.trim();

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled ? styles.fieldDisabled : null]}
        onPress={handleFieldPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!disabled }}
      >
        <Text style={[styles.value, !value ? styles.valuePlaceholder : null]}>
          {value ? value.name : title}
        </Text>
      </TouchableOpacity>
      {disabled && disabledHelperText ? (
        <Text style={styles.disabledHelper}>{disabledHelperText}</Text>
      ) : null}

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
            accessibilityLabel={t('profile.cityPickerCloseA11y')}
          />
          <View style={styles.sheetOuter} pointerEvents="box-none">
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TextInput
                ref={searchInputRef}
                style={styles.search}
                placeholder={placeholder}
                placeholderTextColor={colors.textDisabled}
                value={query}
                onChangeText={setQuery}
                textAlign="right"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isLoading ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : error != null ? (
                <Text style={styles.errorText}>{resolvedErrorText}</Text>
              ) : (
                <FlatList
                  data={filtered as T[]}
                  keyExtractor={(item, idx) => `${renderRow(item).id}-${idx}`}
                  keyboardShouldPersistTaps="handled"
                  ListHeaderComponent={
                    showFreeTextRow ? (
                      <TouchableOpacity
                        style={[styles.row, styles.freeTextRow]}
                        onPress={handleFreeTextPress}
                        accessibilityRole="button"
                      >
                        <Text style={styles.freeTextLabel}>
                          {t('profile.streetPickerUseMyText', { value: trimmedQuery })}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  ListEmptyComponent={
                    !showFreeTextRow ? (
                      <Text style={styles.emptyText}>{resolvedEmptyText}</Text>
                    ) : null
                  }
                  renderItem={({ item }) => {
                    const row = renderRow(item);
                    return (
                      <TouchableOpacity
                        style={styles.row}
                        onPress={() => handleRowPress(row)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.rowText}>{row.name}</Text>
                      </TouchableOpacity>
                    );
                  }}
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
  fieldDisabled: { opacity: 0.5 },
  disabledHelper: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  value: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  valuePlaceholder: { color: colors.textDisabled },
  modalRoot: { flex: 1 },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetOuter: { flex: 1, justifyContent: 'flex-end' },
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
  freeTextRow: { backgroundColor: colors.primarySurface },
  freeTextLabel: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '600',
  },
});
