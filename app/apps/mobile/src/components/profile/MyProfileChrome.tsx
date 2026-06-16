// app/apps/mobile/src/components/profile/MyProfileChrome.tsx
// Shared chrome for My Profile open/closed routes (`/profile`, `/profile/closed`).
// Renders TopBar + profile card (⋮ menu: web uses `right` when `dir=rtl` / `I18nManager.isRTL`; native uses `start`) + …
// Tab clicks navigate to the sibling route (router.replace, so no back-stack
// build-up across tab toggles).
// Mapped to: FR-PROFILE-001 AC1, AC4.
import React from 'react';
import { I18nManager, Platform, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing } from '@kc/ui';
import { TopBar } from '../TopBar';
import { ProfileTabs, type ProfilePostsTab } from './ProfileTabs';
import { MyProfileOverflowMenu } from './MyProfileOverflowMenu';
import { MyProfileCard } from './MyProfileCard';
import { MotionEntry, ENTRY_DELAY } from '../ui/MotionEntry';
import { useAuthStore } from '../../store/authStore';
import { getUserRepo } from '../../services/userComposition';
import { useProfileTabCounts } from '../../hooks/useProfileTabCounts';
import { useProfileShare } from '../../hooks/useProfileShare';

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
  const styles = useMyProfileChromeStyles();
  const router = useRouter();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session)?.userId;

  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000, // PERF-3: profile (self) — edit-profile invalidates explicitly
  });
  const user = userQuery.data ?? null;
  const tabCounts = useProfileTabCounts({
    profileUserId: userId,
    viewerUserId: userId ?? null,
    enabled: Boolean(userId),
  });
  const displayName = user?.displayName?.trim() || t('profile.fallbackName');
  const profileShare = useProfileShare(user?.shareHandle, displayName);
  const handle = user?.shareHandle ?? '';

  const goToTab = (next: ProfilePostsTab) => {
    if (next === activeTab) return;
    router.replace(next === 'closed' ? '/(tabs)/profile/closed' : '/(tabs)/profile');
  };
  const pushToHandle = (segment: 'followers' | 'following') =>
    router.push({ pathname: `/user/[handle]/${segment}` as never, params: { handle } });

  return (
    <>
      <TopBar />
      <MotionEntry variant="hero" delay={ENTRY_DELAY.hero}>
        <View style={styles.profileOuter}>
          <View
            style={[styles.profileMenuCorner, profileMenuCornerHorizontalInset()]}
            pointerEvents="box-none"
          >
            <MyProfileOverflowMenu showFollowRequests={user?.privacyMode === 'Private'} />
          </View>
          <MyProfileCard
            loading={userQuery.isLoading && user === null}
            user={user}
            displayName={displayName}
            postsCount={tabCounts.totalCount ?? 0}
            share={profileShare}
            onEdit={() => router.push('/edit-profile')}
            onStats={() => router.push('/stats')}
            onLock={() => router.push('/settings')}
            onFollowers={() => pushToHandle('followers')}
            onFollowing={() => pushToHandle('following')}
          />
        </View>
      </MotionEntry>
      <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
        <ProfileTabs
          active={activeTab}
          onChange={goToTab}
          openCount={tabCounts.openCount}
          closedCount={tabCounts.closedCount}
        />
      </MotionEntry>
    </>
  );
}

const useMyProfileChromeStyles = makeUseStyles(() => ({
  profileOuter: {
    margin: spacing.base,
    position: 'relative' as const,
  },
  profileMenuCorner: {
    position: 'absolute' as const,
    top: spacing.sm,
    zIndex: 2,
  },
}));
