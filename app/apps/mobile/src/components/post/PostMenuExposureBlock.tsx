// FR-POST-003, FR-POST-021 + D-32 — exposure controls inside post ⋮ menu (detail).
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PostVisibility } from '@kc/domain';
import { makeUseStyles, PlatformSwitch, radius, spacing, typography } from '@kc/ui';
import { usePostActorPrivacyModel } from '../../hooks/usePostActorPrivacyModel';
import type { PostWithOwner } from '@kc/application';
import { useFeedSessionStore } from '../../store/feedSessionStore';
import {
  crossAxisAlignStart,
  layoutDirectionStyle,
  layoutWritingDirectionStyle,
  mainAxisAlignStart,
  selfAlignStart,
  textAlignStart,
} from '../../lib/rtlLayout';

interface Props {
  readonly post: PostWithOwner;
  readonly viewerId: string;
}

export function PostMenuExposureBlock({ post, viewerId }: Props) {
  const { t } = useTranslation();
  const styles = usePostMenuExposureBlockStyles();
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
        <View style={styles.switchWrap}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('post.visibilityPublic')}</Text>
            <PlatformSwitch
              value={v === 'Public'}
              onValueChange={onPublicFollowersSwitch}
              disabled={m.saving}
            />
            <Text style={styles.switchLabel}>{t('post.visibilityFollowers')}</Text>
          </View>
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

const usePostMenuExposureBlockStyles = makeUseStyles(({ colors }) => ({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
    ...layoutDirectionStyle(),
  },
  subheading: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: textAlignStart(),
    ...layoutWritingDirectionStyle(),
  },
  switchWrap: {
    alignItems: crossAxisAlignStart,
    paddingVertical: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: '100%',
  },
  switchLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: textAlignStart(),
    flexShrink: 1,
    ...layoutWritingDirectionStyle(),
  },
  onlyMeBanner: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  onlyMeText: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: textAlignStart(),
    ...layoutWritingDirectionStyle(),
  },
  upgradeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: mainAxisAlignStart,
    flexWrap: 'wrap',
  },
  upgradeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  upgradeChipText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: textAlignStart(),
    ...layoutWritingDirectionStyle(),
  },
  disabled: { opacity: 0.45 },
  hideBtn: {
    alignSelf: selfAlignStart,
    maxWidth: '100%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hideBtnSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  hideBtnDisabled: { opacity: 0.55 },
  hideBtnLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: textAlignStart(),
    ...layoutWritingDirectionStyle(),
  },
  hideBtnLabelSelected: { color: colors.primary },
  partnerRow: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  partnerLabel: {
    ...typography.caption,
    flex: 1,
    color: colors.textPrimary,
    textAlign: textAlignStart(),
    ...layoutWritingDirectionStyle(),
  },
}));
