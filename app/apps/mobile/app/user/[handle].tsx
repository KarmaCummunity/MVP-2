// Other user's profile screen
// Mapped to: SRS §3.2.2
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { PostCard } from '../../src/components/PostCard';
import { MOCK_POSTS } from '../../src/mock/data';

type FollowState = 'none' | 'following' | 'requested';

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const [followState, setFollowState] = useState<FollowState>('none');

  // Find user from mock data
  const userPost = MOCK_POSTS.find((p) => p.ownerHandle === handle);
  const userName = userPost?.ownerName ?? handle ?? 'משתמש';
  const userPosts = MOCK_POSTS.filter((p) => p.ownerHandle === handle);

  const handleFollow = () => {
    if (followState === 'none') setFollowState('following');
    else if (followState === 'following') setFollowState('none');
  };

  const followLabel =
    followState === 'none' ? 'עקוב' :
    followState === 'following' ? 'מעקב פעיל ✓' :
    'בקשה נשלחה ⏳';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.card}>
          <AvatarInitials name={userName} avatarUrl={null} size={72} />
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.city}>📍 {userPost?.address.cityName ?? 'ישראל'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { count: 24, label: 'עוקבים' },
              { count: 12, label: 'נעקבים' },
              { count: userPosts.length, label: 'פוסטים' },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statCount}>{s.count}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.followBtn, followState !== 'none' && styles.followBtnActive]}
              onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, followState !== 'none' && styles.followBtnTextActive]}>
                {followLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.msgBtn}>
              <Text style={styles.msgBtnText}>שלח הודעה</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        <Text style={styles.sectionTitle}>פוסטים פעילים</Text>
        {userPosts.map((post) => (
          <PostCard key={post.postId} post={post} />
        ))}
        {userPosts.length === 0 && (
          <Text style={styles.emptyText}>אין פוסטים פעילים למשתמש זה.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    margin: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  name: { ...typography.h2, color: colors.textPrimary },
  city: { ...typography.body, color: colors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginVertical: spacing.sm,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statCount: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.sm },
  followBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtnActive: { backgroundColor: colors.primary },
  followBtnText: { ...typography.button, color: colors.primary },
  followBtnTextActive: { color: colors.textInverse },
  msgBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgBtnText: { ...typography.button, color: colors.textPrimary },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'right',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
