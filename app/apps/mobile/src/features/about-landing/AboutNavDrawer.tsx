import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import type { AboutSectionId } from './aboutSectionModel';
import { ABOUT_NAV_ITEMS } from './aboutSectionModel';

export interface AboutNavDrawerProps {
  readonly visible: boolean;
  readonly menuTitle: string;
  readonly hint: string;
  readonly onClose: () => void;
  readonly onSelect: (id: AboutSectionId) => void;
  readonly labelFor: (id: AboutSectionId) => string;
}

export function AboutNavDrawer({
  visible,
  menuTitle,
  hint,
  onClose,
  onSelect,
  labelFor,
}: AboutNavDrawerProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={hint} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{menuTitle}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{hint}</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {ABOUT_NAV_ITEMS.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={styles.row}
                onPress={() => {
                  onSelect(row.id);
                  onClose();
                }}
              >
                <Ionicons name={row.icon as 'home'} size={22} color={colors.secondary} />
                <Text style={styles.rowLabel}>{labelFor(row.id)}</Text>
                <Ionicons name="chevron-back" size={18} color={colors.textDisabled} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '82%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  sheetHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: { paddingBottom: spacing['2xl'] },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
});
