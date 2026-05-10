// app/apps/mobile/app/user/[handle]/index.tsx
// Other-user profile — three modes (Public / Private-approved / Private-not-approved).
// Mapped to SRS: FR-PROFILE-002, 003, 004; FR-FOLLOW-001..006, 011, 012.

import React from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { isFollowError } from '@kc/application';
import { ProfileHeader } from '../../../src/components/profile/ProfileHeader';
import { ProfileStatsRow } from '../../../src/components/profile/ProfileStatsRow';
import { ProfileTabs, type ProfileTab } from '../../../src/components/profile/ProfileTabs';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { LockedPanel } from '../../../src/components/profile/LockedPanel';
import { FollowButton } from '../../../src/components/profile/FollowButton';
import { useAuthStore } from '../../../src/store/authStore';
import { container } from '../../../src/lib/container';
import { getUserRepo } from '../../../src/services/userComposition';
import { getPostRepo, getMyPostsUseCase } from '../../../src/services/postsComposition';
import {
  getFollowUserUseCase, getUnfollowUserUseCase,
  getSendFollowRequestUseCase, getCancelFollowRequestUseCase,
  getGetFollowStateUseCase,
} from '../../../src/services/followComposition';

export default function OtherProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('open');

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
  const allowed = isMe || followInfo?.state === 'following' || u?.privacyMode === 'Public';

  const postsQuery = useQuery({
    queryKey: ['profile-other-posts', u?.userId, activeTab],
    queryFn: () => getMyPostsUseCase().execute({
      userId: u!.userId,
      status: activeTab === 'open' ? ['open'] : ['closed_delivered'],
      limit: 30,
    }),
    enabled: Boolean(allowed && u?.userId),
  });

  if (!handle || userQuery.isLoading)
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;

  if (!u) return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'פרופיל' }} />
      <View style={styles.notFound}><Text style={styles.notFoundText}>משתמש לא נמצא</Text></View>
    </SafeAreaView>
  );

  const handleAction = async (action: 'follow' | 'unfollow' | 'send' | 'cancel') => {
    if (!me) return;
    try {
      if (action === 'follow') await getFollowUserUseCase().execute({ viewerId: me, targetUserId: u.userId });
      else if (action === 'unfollow') await getUnfollowUserUseCase().execute({ viewerId: me, targetUserId: u.userId });
      else if (action === 'send') await getSendFollowRequestUseCase().execute({ viewerId: me, targetUserId: u.userId });
      else await getCancelFollowRequestUseCase().execute({ viewerId: me, targetUserId: u.userId });
      qc.invalidateQueries({ queryKey: ['follow-state', me, u.userId] });
      qc.invalidateQueries({ queryKey: ['profile-other', handle] });
    } catch (err) {
      if (isFollowError(err) && err.code === 'cooldown_active') Alert.alert('לא ניתן לשלוח כרגע', 'נסה שוב כשהקירור יסתיים.');
      else Alert.alert('שגיאה', 'הפעולה נכשלה. נסו שוב.');
    }
  };

  const onFollowPress = () => {
    const s = followInfo?.state;
    if (s === 'not_following_public') handleAction('follow');
    else if (s === 'following') handleAction('unfollow');
    else if (s === 'not_following_private_no_request') handleAction('send');
    else if (s === 'request_pending') handleAction('cancel');
  };

  const startChat = async () => {
    if (!me) return;
    const chat = await container.openOrCreateChat.execute({ viewerId: me, otherUserId: u.userId });
    router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } });
  };

  const block = () => {
    if (!me) return;
    Alert.alert('חסום משתמש?', `${u.displayName} לא יוכל לראות את הפרופיל שלך או לשלוח לך הודעות.`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'חסום', style: 'destructive', onPress: async () => {
        try { await container.blockUser.execute({ blockerId: me, blockedId: u.userId }); router.back(); }
        catch { Alert.alert('שגיאה'); }
      } },
    ]);
  };

  const showLocked = u.privacyMode === 'Private' && followInfo?.state !== 'following' && !isMe;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: u.displayName }} />
      <ScrollView>
        <View style={styles.card}>
          <ProfileHeader
            displayName={u.displayName}
            handle={u.shareHandle}
            avatarUrl={u.avatarUrl}
            biography={u.biography}
            privacyMode={u.privacyMode}
          />

          <ProfileStatsRow
            followersCount={u.followersCount}
            followingCount={u.followingCount}
            postsCount={postsCountQuery.data ?? 0}
            enabled={!showLocked}
            onPressFollowers={() => router.push({ pathname: '/user/[handle]/followers' as never, params: { handle } } as never)}
            onPressFollowing={() => router.push({ pathname: '/user/[handle]/following' as never, params: { handle } } as never)}
          />

          {!isMe ? (
            <View style={styles.actionRow}>
              {followInfo ? (
                <View style={styles.btnFlex}>
                  <FollowButton
                    state={followInfo.state}
                    cooldownUntil={followInfo.cooldownUntil}
                    onPress={onFollowPress}
                  />
                </View>
              ) : null}
              <TouchableOpacity style={styles.msgBtn} onPress={startChat}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                <Text style={styles.msgBtnText}>שלח הודעה</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={block}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {showLocked ? (
          <LockedPanel />
        ) : (
          <>
            <ProfileTabs active={activeTab} onChange={setActiveTab} />
            <ProfilePostsGrid
              posts={postsQuery.data?.posts ?? []}
              isLoading={postsQuery.isLoading}
              empty={activeTab === 'open' ? 'other_open' : 'other_closed'}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = spacing;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { padding: S.xl, alignItems: 'center' },
  notFoundText: { ...typography.h3, color: colors.textPrimary },
  card: { margin: S.base, backgroundColor: colors.surface, borderRadius: radius.lg, padding: S.base, ...shadow.card, gap: S.base },
  actionRow: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  btnFlex: { flex: 1 },
  msgBtn: { height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: S.md, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: S.xs },
  msgBtnText: { ...typography.button, color: colors.textPrimary },
  iconBtn: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
});
