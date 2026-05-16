import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostVisibility } from '@kc/domain';

interface Props {
  value: PostVisibility;
  onChange: (next: PostVisibility) => void;
  /** FR-POST-003 AC4–AC5 — Followers-only requires a private profile. */
  profilePrivacy: 'Public' | 'Private';
  onFollowersOnlyBlockedPress?: () => void;
}

const ROWS: { v: PostVisibility; labelKey: string; subKey: string }[] = [
  { v: 'Public', labelKey: 'post.visibilityPublic', subKey: 'post.visibilityPublicSub' },
  { v: 'FollowersOnly', labelKey: 'post.visibilityFollowers', subKey: 'post.visibilityFollowersSub' },
  { v: 'OnlyMe', labelKey: 'post.visibilityOnlyMe', subKey: 'post.visibilityOnlyMeSub' },
];

export function VisibilityChooser({
  value,
  onChange,
  profilePrivacy,
  onFollowersOnlyBlockedPress,
}: Props) {
  const { t } = useTranslation();
  const followersLocked = profilePrivacy === 'Public';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('post.visibility')}</Text>
      {ROWS.map(({ v, labelKey, subKey }) => {
        const isFollowersRow = v === 'FollowersOnly';
        const disabled = isFollowersRow && followersLocked;
        const sub = disabled ? t('post.visibilityFollowersLockedSub') : t(subKey);
        return (
          <TouchableOpacity
            key={v}
            style={[styles.row, value === v && styles.rowActive, disabled && styles.rowDisabled]}
            onPress={() => {
              if (disabled) {
                onFollowersOnlyBlockedPress?.();
                return;
              }
              onChange(v);
            }}
            accessibilityState={{ disabled }}
          >
            <View style={[styles.radio, value === v && styles.radioActive]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, disabled && styles.labelDisabled]}>{t(labelKey)}</Text>
              <Text style={[styles.sub, disabled && styles.subDisabled]}>{sub}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  rowDisabled: { opacity: 0.55 },
  labelDisabled: { color: colors.textDisabled },
  subDisabled: { color: colors.textDisabled },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  label: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  sub: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
});
