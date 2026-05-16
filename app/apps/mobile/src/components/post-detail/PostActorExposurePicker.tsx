// FR-POST-021 — three-level identity exposure for the signed-in participant on this post.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostActorIdentityExposure } from '@kc/domain';

interface Props {
  readonly value: PostActorIdentityExposure;
  readonly onSelect: (next: PostActorIdentityExposure) => void;
  readonly disabled?: boolean;
}

const LEVELS: { v: PostActorIdentityExposure; labelKey: string; subKey: string }[] = [
  { v: 'Public', labelKey: 'post.detail.actorExposurePublic', subKey: 'post.detail.actorExposurePublicSub' },
  {
    v: 'FollowersOnly',
    labelKey: 'post.detail.actorExposureFollowers',
    subKey: 'post.detail.actorExposureFollowersSub',
  },
  { v: 'Hidden', labelKey: 'post.detail.actorExposureHidden', subKey: 'post.detail.actorExposureHiddenSub' },
];

export function PostActorExposurePicker({ value, onSelect, disabled }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('post.detail.actorIdentityTitle')}</Text>
      {LEVELS.map(({ v, labelKey, subKey }) => (
        <TouchableOpacity
          key={v}
          style={[styles.row, value === v && styles.rowActive, disabled && styles.rowDisabled]}
          onPress={() => !disabled && onSelect(v)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ selected: value === v, disabled: Boolean(disabled) }}
        >
          <View style={[styles.radio, value === v && styles.radioActive]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t(labelKey)}</Text>
            <Text style={styles.sub}>{t(subKey)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginTop: spacing.md },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  rowDisabled: { opacity: 0.55 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { ...typography.bodySmall, color: colors.textPrimary, textAlign: 'right' },
  sub: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});
