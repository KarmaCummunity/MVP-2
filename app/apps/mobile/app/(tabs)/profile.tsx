// My Profile screen — header + tabs + caller's own posts.
// Mapped to: FR-PROFILE-001 AC1 (avatar + display_name + city-only location + biography + counters in header),
//   FR-AUTH-003 AC5 (session name/avatar used as first-render fallback while findById is in flight),
//   FR-POST-016 (caller's own posts list).
// Closes TD-42 (followers/following counters now read from User via IUserRepository.findById).
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { TopBar } from '../../src/components/TopBar';
import { ProfileHeader } from '../../src/components/profile/ProfileHeader';
import { ProfileStatsRow } from '../../src/components/profile/ProfileStatsRow';
import { ProfileTabs, type ProfileTab } from '../../src/components/profile/ProfileTabs';
import { ProfilePostsGrid } from '../../src/components/profile/ProfilePostsGrid';
import { useAuthStore } from '../../src/store/authStore';
import { getMyPostsUseCase, getPostRepo } from '../../src/services/postsComposition';
import { getUserRepo } from '../../src/services/userComposition';
import { formatUserLocationLine } from '../../src/lib/formatUserLocationLine';
import { getRestoredProfileTab, persistProfileTab } from '../../src/lib/profileTabSession';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId;
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getRestoredProfileTab('self'));

  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
  });
  const user = userQuery.data ?? null;
  const displayName = (user?.displayName?.trim() || resolveDisplayName(session));
  const avatarUrl = user?.avatarUrl ?? session?.avatarUrl ?? null;
  const biography = user?.biography ?? null;

  const openCountQuery = useQuery({
    queryKey: ['my-open-count', userId],
    queryFn: () => getPostRepo().countOpenByUser(userId!),
    enabled: Boolean(userId),
  });

  const myPostsQuery = useQuery({
    queryKey: ['my-posts', userId, activeTab],
    queryFn: () =>
      getMyPostsUseCase().execute({
        userId: userId!,
        status: activeTab === 'open' ? ['open'] : ['closed_delivered', 'deleted_no_recipient'],
        limit: 30,
      }),
    enabled: Boolean(userId),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false}>


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
            postsCount={openCountQuery.data ?? 0}
            enabled
            onPressFollowers={() => router.push({
              pathname: '/user/[handle]/followers' as never,
              params: { handle: user?.shareHandle ?? '' },
            })}
            onPressFollowing={() => router.push({
              pathname: '/user/[handle]/following' as never,
              params: { handle: user?.shareHandle ?? '' },
            })}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editBtnText}>ערוך פרופיל</Text>
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

        <ProfileTabs
          active={activeTab}
          onChange={(t) => {
            persistProfileTab('self', t);
            setActiveTab(t);
          }}
        />

        <ProfilePostsGrid
          posts={myPostsQuery.data?.posts ?? []}
          isLoading={myPostsQuery.isLoading}
          empty={activeTab === 'open' ? 'self_open' : 'self_closed'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function resolveDisplayName(session: ReturnType<typeof useAuthStore.getState>['session']): string {
  if (session?.displayName && session.displayName.trim().length > 0) return session.displayName;
  if (session?.email) {
    const local = session.email.split('@')[0];
    if (local && local.length > 0) return local;
  }
  return 'משתמש';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm },
  topBarTitle: { ...typography.h3, color: colors.textPrimary },
  profileCard: {
    margin: spacing.base, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.base, ...shadow.card, gap: spacing.base,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  editBtn: {
    flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  editBtnText: { ...typography.button, color: colors.textPrimary },
  shareBtn: {
    width: 40, height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
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
