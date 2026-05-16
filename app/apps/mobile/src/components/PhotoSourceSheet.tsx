import { useTranslation } from 'react-i18next';
// FR-AUTH-011 AC1 — bottom-sheet action picker for profile photo source.
// Camera button auto-hidden on web (no native camera).
import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { colors, typography, spacing, radius, shadow } from '@kc/ui';
import { isCameraAvailable, type AvatarSource } from '../services/avatarUpload';

interface Props {
  readonly visible: boolean;
  readonly canRemove: boolean;
  readonly onPick: (source: AvatarSource) => void;
  readonly onRemove: () => void;
  readonly onClose: () => void;
}

export function PhotoSourceSheet({
  const { t } = useTranslation(); visible, canRemove, onPick, onRemove, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('profile.photoSheetTitle')}</Text>

          {isCameraAvailable && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => onPick('camera')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.takePictureA11y')}
            >
              <Text style={styles.optionText}>{t('profile.takePicture')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.option}
            onPress={() => onPick('gallery')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.chooseFromGalleryA11y')}
          >
            <Text style={styles.optionText}>{t('profile.chooseFromGallery')}</Text>
          </TouchableOpacity>

          {canRemove && (
            <TouchableOpacity
              style={styles.option}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={t('profile.removePhotoA11y')}
            >
              <Text style={[styles.optionText, styles.removeText]}>{t('profile.removePhotoBtn')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.option, styles.cancel]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.optionText, styles.cancelText]}>{t('general.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
    ...shadow.card,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  optionText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  removeText: { color: colors.error },
  cancel: { backgroundColor: 'transparent', marginTop: spacing.xs },
  cancelText: { color: colors.textSecondary, textAlign: 'center' },
});
