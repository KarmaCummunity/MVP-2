// My Profile screen
// Mapped to: SRS §3.2.1
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { PostCard } from '../../src/components/PostCard';
import { EmptyState } from '../../src/components/EmptyState';
import { MOCK_USER, MOCK_POSTS } from '../../src/mock/data';

type Tab = 'active' | 'closed';

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const user = MOCK_USER;
  const myPosts = MOCK_POSTS.filter((p) => p.ownerId === 'me');
  // Show all mock posts on active tab since we have no "me" posts in mock data
  const displayPosts = MOCK_POSTS.slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>הפרופיל שלי</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarInitials
              name={user.displayName}
              avatarUrl={user.avatarUrl}
              size={72}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.city}>📍 {user.cityName}</Text>
              {user.biography ? (
                <Text style={styles.bio}>{user.biography}</Text>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatItem count={user.followersCount} label="עוקבים" />
            <View style={styles.statDivider} />
            <StatItem count={user.followingCount} label="נעקבים" />
            <View style={styles.statDivider} />
            <StatItem count={user.activePostsCountInternal} label="פוסטים" />
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>ערוך פרופיל</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              פוסטים פעילים
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closed' && styles.tabActive]}
            onPress={() => setActiveTab('closed')}
          >
            <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>
              פוסטים שנמסרו
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {activeTab === 'active' ? (
          displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))
          ) : (
            <EmptyState
              emoji="📭"
              title="אין פוסטים פעילים"
              subtitle="פרסם את הפוסט הראשון שלך!"
            />
          )
        ) : (
          <EmptyState
            emoji="📦"
            title="אין פוסטים שנמסרו עדיין"
            subtitle="פוסטים שסגרת כ-נמסר יופיעו כאן."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: { ...typography.h3, color: colors.textPrimary },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    margin: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadow.card,
    gap: spacing.base,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'flex-start',
  },
  profileInfo: { flex: 1, gap: spacing.xs },
  displayName: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  city: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.button, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
});
