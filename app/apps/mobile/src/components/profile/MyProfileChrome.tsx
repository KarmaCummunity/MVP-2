// app/apps/mobile/src/components/profile/MyProfileChrome.tsx
// Shared chrome for the two My Profile routes (`/profile`, `/profile/closed`).
// Renders TopBar + header + stats + actions + stats link + ProfileTabs.
// Tab clicks navigate to the sibling route (router.replace, so no back-stack
// build-up across tab toggles).
// Mapped to: FR-PROFILE-001 AC1, AC4.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { TopBar } from '../TopBar';
import { ProfileHeader } from './ProfileHeader';
import { ProfileStatsRow } from './ProfileStatsRow';
import { ProfileTabs, type ProfileTab } from './ProfileTabs';
import { useAuthStore } from '../../store/authStore';
import { getPostRepo } from '../../services/postsComposition';
import { getUserRepo } from '../../services/userComposition';
import { formatUserLocationLine } from '../../lib/formatUserLocationLine';

export function MyProfileChrome({ activeTab }: { activeTab: ProfileTab }) {
  const router = useRouter();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId;

  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
  });
  const user = userQuery.data ?? null;
  const displayName = user?.displayName?.trim() || resolveDisplayName(session);
  const avatarUrl = user?.avatarUrl ?? session?.avatarUrl ?? null;
  const biography = user?.biography ?? null;

  const openCountQuery = useQuery({
    queryKey: ['my-open-count', userId],
    queryFn: () => getPostRepo().countOpenByUser(userId!),
    enabled: Boolean(userId),
  });

  const goToTab = (next: ProfileTab) => {
    if (next === activeTab) return;
    if (next === 'closed') router.replace('/(tabs)/profile/closed');
    else if (next === 'removed') router.replace('/(tabs)/profile/removed' as never);
    else router.replace('/(tabs)/profile');
  };

  return (
    <>
      <TopBar />
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
      <ProfileTabs active={activeTab} onChange={goToTab} />
    </>
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
  profileCard: {
    margin: spacing.base,
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
