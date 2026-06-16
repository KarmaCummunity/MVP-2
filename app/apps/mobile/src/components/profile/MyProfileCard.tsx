// app/apps/mobile/src/components/profile/MyProfileCard.tsx
// Presentational card for the My Profile chrome: avatar/header, stats row, karma
// badge, action buttons (edit + share) and the stats deep-link. Pure props in —
// keeps the data/wiring container (MyProfileChrome) shallow. Mapped to FR-PROFILE-001.
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, radius, spacing, typography, useTheme } from '@kc/ui';
import type { PrivacyMode, User } from '@kc/domain';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStatsRow } from './ProfileStatsRow';
import { Card } from '../ui/Card';
import { KarmaBadge } from './KarmaBadge';
import { formatUserLocationLine } from '../../lib/formatUserLocationLine';
import { rowDirectionStart } from '../../lib/rtlLayout';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';

export type ProfileShareState = Readonly<{ canShare: boolean; busy: boolean; share: () => void }>;

// Null-safe view of the fields the card renders. Collapsing the `user?.x ?? d`
// chain into one place keeps every render function branch-free.
type ProfileCardView = Readonly<{
  hasUser: boolean;
  avatarUrl: string | null;
  biography: string | null;
  privacyMode: PrivacyMode;
  locationLine: string | null;
  followersCount: number;
  followingCount: number;
  karmaPoints: number;
}>;

const EMPTY_VIEW: ProfileCardView = {
  hasUser: false,
  avatarUrl: null,
  biography: null,
  privacyMode: 'Public',
  locationLine: null,
  followersCount: 0,
  followingCount: 0,
  karmaPoints: 0,
};

function toCardView(user: User | null): ProfileCardView {
  if (!user) return EMPTY_VIEW;
  return {
    hasUser: true,
    avatarUrl: user.avatarUrl,
    biography: user.biography,
    privacyMode: user.privacyMode,
    locationLine: formatUserLocationLine(user),
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    karmaPoints: user.karmaPoints,
  };
}

export type MyProfileCardProps = Readonly<{
  loading: boolean;
  user: User | null;
  displayName: string;
  postsCount: number;
  share: ProfileShareState;
  onEdit: () => void;
  onStats: () => void;
  onLock: () => void;
  onFollowers: () => void;
  onFollowing: () => void;
}>;

type BodyProps = Readonly<{
  view: ProfileCardView;
  displayName: string;
  postsCount: number;
  onLock: () => void;
  onFollowers: () => void;
  onFollowing: () => void;
}>;

function ProfileCardBody({ view, displayName, postsCount, onLock, onFollowers, onFollowing }: BodyProps) {
  return (
    <>
      <ProfileHeader
        displayName={displayName}
        locationLine={view.locationLine}
        avatarUrl={view.avatarUrl}
        biography={view.biography}
        privacyMode={view.privacyMode}
        onLockPress={onLock}
        size={72}
      />
      <ProfileStatsRow
        followersCount={view.followersCount}
        followingCount={view.followingCount}
        postsCount={postsCount}
        enabled={view.hasUser}
        onPressFollowers={onFollowers}
        onPressFollowing={onFollowing}
      />
      {view.hasUser ? <KarmaBadge points={view.karmaPoints} /> : null}
    </>
  );
}

function ProfileCardActions({ share, onEdit, onStats }: Pick<MyProfileCardProps, 'share' | 'onEdit' | 'onStats'>) {
  const styles = useMyProfileCardStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const shareDisabled = !share.canShare || share.busy;
  return (
    <>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={share.share}
          disabled={shareDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('profile.shareProfile')}
          accessibilityState={{ disabled: shareDisabled }}
        >
          <Ionicons name="share-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.statsLink}
        onPress={onStats}
        accessibilityRole="button"
        accessibilityLabel={t('settings.stats')}
      >
        <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
        <Text style={styles.statsLinkText}>{t('settings.stats')}</Text>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </>
  );
}

export function MyProfileCard(props: MyProfileCardProps) {
  const { loading, user, displayName, postsCount } = props;
  const styles = useMyProfileCardStyles();
  const { colors } = useTheme();

  return (
    <Card padding="base" style={styles.profileCard}>
      {loading ? (
        <View style={styles.profileLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ProfileCardBody
          view={toCardView(user)}
          displayName={displayName}
          postsCount={postsCount}
          onLock={props.onLock}
          onFollowers={props.onFollowers}
          onFollowing={props.onFollowing}
        />
      )}
      <ProfileCardActions share={props.share} onEdit={props.onEdit} onStats={props.onStats} />
    </Card>
  );
}

const useMyProfileCardStyles = makeUseStyles(({ colors }) => ({
  profileCard: { gap: spacing.base },
  profileLoading: {
    minHeight: 120,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  actionRow: { flexDirection: 'row' as const, gap: spacing.sm },
  editBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  editBtnText: { ...typography.button, color: colors.textPrimary },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  statsLink: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  statsLinkText: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: rtlTextAlignStart },
}));
