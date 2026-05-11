// Bottom-sheet menu shown from the chat header overflow icon. Replaces the
// previous Alert.alert action picker, which RN-Web collapses into a plain
// window.alert (silently dropping the buttons[]) — making the menu unreachable
// in the browser.
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '@kc/ui';

interface Props {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onReport: () => void;
  readonly deleteLabel?: string;
  readonly onDeleteFromInbox?: () => void;
}

export function ChatActionMenu({
  visible,
  onClose,
  onReport,
  deleteLabel,
  onDeleteFromInbox,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {onDeleteFromInbox && deleteLabel ? (
            <>
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onClose();
                  onDeleteFromInbox();
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.itemText, styles.itemDestructive]}>{deleteLabel}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          ) : null}
          <TouchableOpacity style={styles.item} onPress={onReport} accessibilityRole="button">
            <Text style={styles.itemText}>דווח על השיחה</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.item} onPress={onClose} accessibilityRole="button">
            <Text style={[styles.itemText, styles.itemCancel]}>ביטול</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingVertical: spacing.xs,
  },
  item: { paddingVertical: spacing.md, paddingHorizontal: spacing.base, alignItems: 'center' },
  itemText: { ...typography.body, color: colors.textPrimary },
  itemDestructive: { color: colors.error },
  itemCancel: { ...typography.semiBold, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
