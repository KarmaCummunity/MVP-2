// app/apps/mobile/src/components/profile/MyProfileChrome.tsx
// Shared chrome for My Profile open/closed routes (`/profile`, `/profile/closed`).
// Renders TopBar + profile card (⋮ menu: web uses `right` when `dir=rtl` / `I18nManager.isRTL`; native uses `start`) + …
// Tab clicks navigate to the sibling route (router.replace, so no back-stack
// build-up across tab toggles).
// Mapped to: FR-PROFILE-001 AC1, AC4.
import React from 'react';
import { I18nManager, Platform, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { TopBar } from '../TopBar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStatsRow } from './ProfileStatsRow';
import { ProfileTabs, type ProfilePostsTab } from './ProfileTabs';
import { MyProfileOverflowMenu } from './MyProfileOverflowMenu';
import { useAuthStore } from '../../store/authStore';
import { getUserRepo } from '../../services/userComposition';
import { formatUserLocationLine } from '../../lib/formatUserLocationLine';

/**
 * RN-Web: absolute `start` ignores RTL like native. `I18nManager.isRTL` is also false at
 * module load (forceRTL runs in RootLayout `useEffect`), so we must not read RTL once at import.
 * Prefer DOM `dir` (set synchronously in `app/_layout.tsx` for web) then live `I18nManager`.
 */
function profileMenuCornerHorizontalInset(): Pick<ViewStyle, 'left' | 'right' | 'start'> {
  if (Platform.OS !== 'web') return { start: spacing.sm };
  const docRtl =
    typeof document !== 'undefined' &&
    (document.documentElement.dir === 'rtl' ||
      document.documentElement.getAttribute('dir') === 'rtl');
  const rtl = docRtl || I18nManager.isRTL;
  return rtl ? { right: spacing.sm } : { left: spacing.sm };
}

export function MyProfileChrome({ activeTab }: Readonly<{ activeTab: ProfilePostsTab }>) {
  const router = useRouter();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId;
  const fallbackName = t('profile.fallbackName');

  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
  });
  const user = userQuery.data ?? null;
  const displayName = user?.displayName?.trim() || resolveDisplayName(session, fallbackName);
  const avatarUrl = user?.avatarUrl ?? session?.avatarUrl ?? null;
  const biography = user?.biography ?? null;

  const goToTab = (next: ProfilePostsTab) => {
    if (next === activeTab) return;
    if (next === 'closed') router.replace('/(tabs)/profile/closed');
    else router.replace('/(tabs)/profile');
  };

  return (
    <>
      <TopBar />
      <View style={styles.profileOuter}>
        <View
          style={[styles.profileMenuCorner, profileMenuCornerHorizontalInset()]}
          pointerEvents="box-none"
        >
          <MyProfileOverflowMenu showFollowRequests={user?.privacyMode === 'Private'} />
        </View>
        <View style={styles.profileCard}>
          <ProfileHeader
            displayName={displayName}
            locationLine={user ? formatUserLocationLine(user) : null}
            avatarUrl={avatarUrl}
            biography={biography}
            privacyMode={user?.privacyMode ?? 'Public'}
            onLockPress={() => router.push('/settings/privacy' as never)}
            size={72}
          />
          <ProfileStatsRow
            followersCount={user?.followersCount ?? 0}
            followingCount={user?.followingCount ?? 0}
            postsCount={user?.activePostsCountInternal ?? 0}
            enabled
            onPressFollowers={() =>
              router.push({
                pathname: '/user/[handle]/followers' as never,
                params: { handle: user?.shareHandle ?? '' },
              })
            }
            onPressFollowing={() =>
              router.push({
                pathname: '/user/[handle]/following' as never,
                params: { handle: user?.shareHandle ?? '' },
              })
            }
          />
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.statsLink}
            onPress={() => router.push('/stats')}
            accessibilityRole="button"
            accessibilityLabel={t('settings.stats')}
          >
            <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
            <Text style={styles.statsLinkText}>{t('settings.stats')}</Text>
            <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <ProfileTabs active={activeTab} onChange={goToTab} />
    </>
  );
}

function resolveDisplayName(
  session: ReturnType<typeof useAuthStore.getState>['session'],
  fallbackName: string,
): string {
  if (session?.displayName && session.displayName.trim().length > 0) return session.displayName;
  if (session?.email) {
    const local = session.email.split('@')[0];
    if (local && local.length > 0) return local;
  }
  return fallbackName;
}

const styles = StyleSheet.create({
  profileOuter: {
    margin: spacing.base,
    position: 'relative',
  },
  profileMenuCorner: {
    position: 'absolute',
    top: spacing.sm,
    zIndex: 2,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadow.card,
    gap: spacing.base,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: { ...typography.button, color: colors.textPrimary },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  statsLinkText: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
});
