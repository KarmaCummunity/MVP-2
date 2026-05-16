// app/apps/mobile/app/user/[handle]/index.tsx
// Other-user profile — uniform render for Public and Private profiles.
// Per D-21 the Private mode no longer hides posts/counters/lists; the only
// user-facing differences are the lock icon (FR-PROFILE-012) and the
// "Send Follow Request" CTA (FR-FOLLOW-006).
// Mapped to SRS: FR-PROFILE-002, 003, 004; FR-FOLLOW-001..006, 011, 012.

import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useProfileClosedPosts } from '../../../src/hooks/useProfileClosedPosts';
import { colors } from '@kc/ui';
import { ProfileHeader } from '../../../src/components/profile/ProfileHeader';
import { ProfileStatsRow } from '../../../src/components/profile/ProfileStatsRow';
import { ProfileTabs, type ProfilePostsTab } from '../../../src/components/profile/ProfileTabs';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { ProfileClosedPostsGrid } from '../../../src/components/profile/ProfileClosedPostsGrid';
import { FollowButton } from '../../../src/components/profile/FollowButton';
import { useAuthStore } from '../../../src/store/authStore';
import { getUserRepo } from '../../../src/services/userComposition';
import { getPostRepo, getMyPostsUseCase } from '../../../src/services/postsComposition';
import { getGetFollowStateUseCase } from '../../../src/services/followComposition';
import { useOptimisticFollowAction, type FollowActionError } from '../../../src/hooks/useOptimisticFollowAction';
import { useOtherProfileActions } from '../../../src/hooks/useOtherProfileActions';
import { NotifyModal } from '../../../src/components/NotifyModal';
import { ProfileOverflowMenu } from '../../../src/components/profile/ProfileOverflowMenu';
import { formatUserLocationLine } from '../../../src/lib/formatUserLocationLine';
import { getRestoredProfileTab, persistProfileTab } from '../../../src/lib/profileTabSession';
import { otherProfileScreenStyles as styles } from '../../../src/components/profile/otherProfileScreen.styles';
import { nativeStackHeaderRightIconOnly } from '../../../src/navigation/nativeHeaderIconOnly';

export default function OtherProfileScreen() {
  const { t } = useTranslation();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const [activeTab, setActiveTab] = React.useState<ProfilePostsTab>(() =>
    getRestoredProfileTab({ otherHandle: handle ?? '' }),
  );
  // ✅ RULES OF HOOKS: must be declared here, before any early return.
  const [error, setError] = React.useState<FollowActionError | null>(null);

  const userQuery = useQuery({
    queryKey: ['profile-other', handle],
    queryFn: () => getUserRepo().findByHandle(handle!),
    enabled: Boolean(handle),
  });
  const u = userQuery.data ?? null;

  const stateQuery = useQuery({
    queryKey: ['follow-state', me, u?.userId],
    queryFn: () => getGetFollowStateUseCase().execute({ viewerId: me!, targetUserId: u!.userId }),
    enabled: Boolean(me && u?.userId && me !== u.userId),
  });
  const followInfo = stateQuery.data;

  const postsCountQuery = useQuery({
    queryKey: ['profile-other-post-count', u?.userId],
    queryFn: () => getPostRepo().countOpenByUser(u!.userId),
    enabled: Boolean(u?.userId),
  });

  const isMe = me === u?.userId;

  // ✅ RULES OF HOOKS: useOptimisticFollowAction must be called here, before any early return.
  // When `u` is null (still loading), we pass a safe fallback so the hook is always called.
  const dispatchFollowAction = useOptimisticFollowAction({
    viewerId: me,
    target: u ?? { userId: '', shareHandle: '', privacyMode: 'Public' } as any,
    handle: handle ?? '',
    onError: setError,
  });

  // /user/[my-handle] redirects to the My Profile tab.
  React.useEffect(() => { if (isMe) router.replace('/(tabs)/profile'); }, [isMe, router]);

  const postsQuery = useQuery({
    queryKey: ['profile-other-posts', u?.userId],
    queryFn: () => getMyPostsUseCase().execute({
      userId: u!.userId,
      status: ['open'],
      limit: 30,
    }),
    enabled: Boolean(u?.userId) && activeTab === 'open',
  });

  const closed = useProfileClosedPosts({
    profileUserId: u?.userId,
    viewerUserId: me ?? null,
    enabled: activeTab === 'closed',
  });

  if (!handle || userQuery.isLoading)
    return <SafeAreaView style={styles.container} edges={['bottom']}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;

  if (!u) return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerTitle: t('profile.otherScreen.headerTitle') }} />
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{t('profile.otherScreen.userNotFound')}</Text>
      </View>
    </SafeAreaView>
  );

  const { onFollowPress, startChat } = useOtherProfileActions({ me, target: u, dispatchFollowAction });

  // CTA paints immediately during stateQuery flight. On error we keep the button
  // visible but busy/disabled so a transient failure can't double-tap-fire.
  const followState = followInfo?.state ?? 'not_following_public';
  const showFollowButton = Boolean(me) && !isMe;
  const followBusy = stateQuery.isLoading || stateQuery.isError;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: '',
          ...(!isMe
            ? nativeStackHeaderRightIconOnly(() => <ProfileOverflowMenu targetUserId={u.userId} />)
            : { headerRight: undefined }),
        }}
      />
      <ScrollView>
        <View style={styles.card}>
          <ProfileHeader
            displayName={u.displayName ?? t('profile.fallbackName')}
            handle={u.shareHandle}
            locationLine={formatUserLocationLine(u)}
            avatarUrl={u.avatarUrl}
            biography={u.biography}
            privacyMode={u.privacyMode}
          />

          <ProfileStatsRow
            followersCount={u.followersCount}
            followingCount={u.followingCount}
            postsCount={postsCountQuery.data ?? 0}
            enabled
            onPressFollowers={() => router.push({ pathname: '/user/[handle]/followers' as never, params: { handle } } as never)}
            onPressFollowing={() => router.push({ pathname: '/user/[handle]/following' as never, params: { handle } } as never)}
          />

          {!isMe ? (
            <View style={styles.actionRow}>
              {showFollowButton ? (
                <View style={styles.btnFlex}>
                  <FollowButton
                    state={followState}
                    cooldownUntil={followInfo?.cooldownUntil}
                    onPress={() => onFollowPress(followInfo?.state)}
                    busy={followBusy}
                    interactionDisabled={followInfo?.followInteractionDisabled}
                  />
                </View>
              ) : null}
              <TouchableOpacity style={styles.msgBtn} onPress={startChat}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                <Text style={styles.msgBtnText}>{t('profile.otherScreen.sendMessage')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <ProfileTabs
          active={activeTab}
          onChange={(t) => {
            if (handle) persistProfileTab({ otherHandle: handle }, t);
            setActiveTab(t);
          }}
        />
        {activeTab === 'open' ? (
          <ProfilePostsGrid
            posts={postsQuery.data?.posts ?? []}
            isLoading={postsQuery.isLoading}
            empty="other_open"
          />
        ) : (
          <ProfileClosedPostsGrid
            items={closed.items}
            isLoading={closed.isLoading}
            empty="other_closed"
            hasMore={closed.hasMore}
            isLoadingMore={closed.isLoadingMore}
            onLoadMore={closed.loadMore}
          />
        )}
      </ScrollView>
      <NotifyModal
        visible={error !== null}
        title={error?.title ?? ''}
        message={error?.message ?? ''}
        onDismiss={() => setError(null)}
      />
    </SafeAreaView>
  );
}
