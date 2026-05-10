// My Profile screen — wired to getMyPosts + countOpenByUser (P0.4-FE).
// Mapped to: FR-PROFILE-001 (header, tabs, counters), FR-AUTH-003 AC5 (Google name/avatar via AuthSession),
// FR-POST-016 (caller's own posts list).
// TD-42 (followers/following/items_given/items_received) remains until IUserRepository.findById ships (P2.4).
import React, { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, shadow, spacing, typography } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';
import { PostCardProfile } from '../../src/components/PostCardProfile';
import { TopBar } from '../../src/components/TopBar';
import { useAuthStore } from '../../src/store/authStore';
import { getMyPostsUseCase, getPostRepo } from '../../src/services/postsComposition';

type Tab = 'open' | 'closed';

export default function ProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId;
  const [activeTab, setActiveTab] = useState<Tab>('open');

  const displayName = resolveDisplayName(session);

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
        status: activeTab === 'open' ? ['open'] : ['closed_delivered'],
        limit: 30,
      }),
    enabled: Boolean(userId),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.topBarTitle}>הפרופיל שלי</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarInitials
              name={displayName}
              avatarUrl={session?.avatarUrl ?? null}
              size={72}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
              {session?.email ? <Text style={styles.email}>{session.email}</Text> : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatItem count={0} label="עוקבים" />
            <View style={styles.statDivider} />
            <StatItem count={0} label="נעקבים" />
            <View style={styles.statDivider} />
            <StatItem count={openCountQuery.data ?? 0} label="פוסטים" />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editBtnText}>ערוך פרופיל</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'open' && styles.tabActive]}
            onPress={() => setActiveTab('open')}
          >
            <Text style={[styles.tabText, activeTab === 'open' && styles.tabTextActive]}>
              פוסטים פתוחים
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closed' && styles.tabActive]}
            onPress={() => setActiveTab('closed')}
          >
            <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>
              פוסטים סגורים
            </Text>
          </TouchableOpacity>
        </View>

        {myPostsQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (myPostsQuery.data?.posts.length ?? 0) === 0 ? (
          activeTab === 'open' ? (
            <EmptyState icon="mail-open-outline" title="אין פוסטים פתוחים" subtitle="פרסם את הפוסט הראשון שלך!" />
          ) : (
            <EmptyState icon="archive-outline" title="אין פוסטים סגורים עדיין" subtitle="פוסטים שסגרת כ-נמסר יופיעו כאן." />
          )
        ) : (
          <View style={styles.grid}>
            {(myPostsQuery.data?.posts ?? []).map((p) => (
              <PostCardProfile key={p.postId} post={p} />
            ))}
          </View>
        )}
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

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.count}>{count}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 2 },
  count: { ...typography.h2, color: colors.textPrimary },
  label: { ...typography.caption, color: colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topBarTitle: { ...typography.h3, color: colors.textPrimary },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    margin: spacing.base, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.base, ...shadow.card, gap: spacing.base,
  },
  profileHeader: { flexDirection: 'row', gap: spacing.base, alignItems: 'flex-start' },
  profileInfo: { flex: 1, gap: spacing.xs },
  displayName: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  email: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
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
  tabs: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.button, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  loadingWrap: { padding: spacing.xl, alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
});
