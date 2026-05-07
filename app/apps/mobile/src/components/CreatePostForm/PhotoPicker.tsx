import React from 'react';
import {
  ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';
import { MAX_MEDIA_ASSETS } from '@kc/domain';
import type { UploadedAsset } from '../../services/imageUpload';

interface Props {
  uploads: UploadedAsset[];
  isUploading: boolean;
  uploadingCount: number;
  required: boolean;
  onAdd: () => void;
  onRemove: (path: string) => void;
}

export function PhotoPicker({ uploads, isUploading, uploadingCount, required, onAdd, onRemove }: Props) {
  const remaining = MAX_MEDIA_ASSETS - uploads.length - uploadingCount;
  const canAdd = remaining > 0 && !isUploading;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        תמונות{' '}
        {required && <Text style={styles.required}>* (חובה עבור "לתת")</Text>}
      </Text>
      <View style={styles.grid}>
        {uploads.map((u) => (
          <View key={u.path} style={styles.thumb}>
            <Image source={{ uri: u.previewUri }} style={styles.thumbImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(u.path)}>
              <Ionicons name="close" size={14} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ))}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <View key={`pending-${i}`} style={[styles.thumb, styles.pending]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ))}
        {canAdd && (
          <TouchableOpacity style={[styles.thumb, styles.addBtn]} onPress={onAdd} disabled={!canAdd}>
            <Ionicons name="add" size={28} color={colors.textSecondary} />
            <Text style={styles.addText}>{remaining}/{MAX_MEDIA_ASSETS}</Text>
          </TouchableOpacity>
        )}
      </View>
      {uploads.length === 0 && !isUploading && (
        <Text style={styles.hint}>בחר עד 5 תמונות מהגלריה.</Text>
      )}
    </View>
  );
}

const THUMB = 96;
const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  required: { color: colors.error },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: {
    width: THUMB, height: THUMB, borderRadius: radius.md,
    backgroundColor: colors.surface, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbImage: { width: '100%', height: '100%' },
  pending: { backgroundColor: colors.skeleton },
  addBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
    backgroundColor: colors.background, gap: 2,
  },
  addText: { ...typography.caption, color: colors.textSecondary },
  removeBtn: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22,
    borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  hint: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
});
