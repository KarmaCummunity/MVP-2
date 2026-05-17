// FR-POST-003, FR-POST-021 + D-32 — exposure controls inside post ⋮ menu (detail).
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PostVisibility } from '@kc/domain';
import { colors, PlatformSwitch, radius, spacing, typography } from '@kc/ui';
import { usePostActorPrivacyModel } from '../../hooks/usePostActorPrivacyModel';
import type { PostWithOwner } from '@kc/application';
import { useFeedSessionStore } from '../../store/feedSessionStore';

interface Props {
  readonly post: PostWithOwner;
  readonly viewerId: string;
}

export function PostMenuExposureBlock({ post, viewerId }: Props) {
  const { t } = useTranslation();
  const m = usePostActorPrivacyModel(post, viewerId);
  const followersLocked = m.profilePrivacy === 'Public';
  const v = m.audienceValue;

  const onFollowersBlocked = () =>
    useFeedSessionStore.getState().showEphemeralToast(t('post.visibilityFollowersLockedSub'), 'success', 3200);

  const onPublicFollowersSwitch = (wantPublic: boolean) => {
    if (m.saving) return;
    const next: PostVisibility = wantPublic ? 'Public' : 'FollowersOnly';
    if (next === 'FollowersOnly' && followersLocked) {
      onFollowersBlocked();
      return;
    }
    if (next === v) return;
    m.onAudienceChange(next);
  };

  const onPressHide = () => {
    if (m.saving || v === 'OnlyMe') return;
    m.onAudienceChange('OnlyMe');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.subheading}>{t('post.exposureSettingsSectionTitle')}</Text>

      {v === 'OnlyMe' ? (
        <View style={styles.onlyMeBanner}>
          <Text style={styles.onlyMeText}>{t('post.exposureOnlyMeActive')}</Text>
          <View style={styles.upgradeRow}>
            <TouchableOpacity
              style={[styles.upgradeChip, m.saving && styles.disabled]}
              disabled={m.saving}
              onPress={() => {
                if (m.saving) return;
                m.onAudienceChange('Public');
              }}
            >
              <Text style={styles.upgradeChipText}>{t('post.visibilityPublic')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.upgradeChip, (m.saving || followersLocked) && styles.disabled]}
              disabled={m.saving || followersLocked}
              onPress={() => {
                if (m.saving) return;
                if (followersLocked) {
                  onFollowersBlocked();
                  return;
                }
                m.onAudienceChange('FollowersOnly');
              }}
            >
              <Text style={styles.upgradeChipText}>{t('post.visibilityFollowers')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('post.visibilityFollowers')}</Text>
          <PlatformSwitch
            value={v === 'Public'}
            onValueChange={onPublicFollowersSwitch}
            disabled={m.saving}
          />
          <Text style={styles.switchLabel}>{t('post.visibilityPublic')}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.hideBtn, v === 'OnlyMe' && styles.hideBtnSelected, m.saving && styles.hideBtnDisabled]}
        onPress={onPressHide}
        disabled={m.saving || v === 'OnlyMe'}
        accessibilityRole="button"
        accessibilityState={{ selected: v === 'OnlyMe', disabled: m.saving || v === 'OnlyMe' }}
      >
        <Text style={[styles.hideBtnLabel, v === 'OnlyMe' && styles.hideBtnLabelSelected]}>
          {t('post.exposureHideOnlyMe')}
        </Text>
      </TouchableOpacity>

      {m.showCounterpartyRow ? (
        <View style={styles.partnerRow}>
          <Text style={styles.partnerLabel}>{t('post.counterpartyMaskLabel')}</Text>
          <PlatformSwitch
            value={m.hide}
            onValueChange={(next) => {
              if (m.saving) return;
              m.onHideChange(next);
            }}
            disabled={m.saving}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  subheading: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  switchLabel: { ...typography.bodySmall, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
  onlyMeBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  onlyMeText: { ...typography.bodySmall, color: colors.textPrimary, textAlign: 'right' },
  upgradeRow: { flexDirection: 'row-reverse', gap: spacing.sm, justifyContent: 'flex-end' },
  upgradeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  upgradeChipText: { ...typography.bodySmall, color: colors.primary, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  hideBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'flex-end',
  },
  hideBtnSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  hideBtnDisabled: { opacity: 0.55 },
  hideBtnLabel: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  hideBtnLabelSelected: { color: colors.primary },
  partnerRow: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerLabel: { ...typography.bodySmall, flex: 1, color: colors.textPrimary, textAlign: 'right' },
});
