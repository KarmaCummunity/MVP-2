// Post detail screen
// Mapped to: SRS §3.3.4
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, typography, spacing, radius, shadow } from '@kc/ui';
import { CATEGORY_LABELS } from '@kc/domain';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { MOCK_POSTS } from '../../src/mock/data';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const post = MOCK_POSTS.find((p) => p.postId === id) ?? MOCK_POSTS[0]!;
  const isGive = post.type === 'Give';

  const locationText = (() => {
    if (post.locationDisplayLevel === 'CityOnly') return post.address.cityName;
    if (post.locationDisplayLevel === 'CityAndStreet')
      return `${post.address.cityName}, רחוב ${post.address.street}`;
    return `${post.address.cityName}, ${post.address.street} ${post.address.streetNumber}`;
  })();

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: dateFnsHe,
  });

  const handleMessage = () => {
    router.push(`/chat/c-${post.ownerId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image placeholder */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderEmoji}>{isGive ? '🎁' : '🔍'}</Text>
          <View style={[styles.typeTagOverlay, isGive ? styles.giveTag : styles.requestTag]}>
            <Text style={styles.typeTagText}>{isGive ? '🎁 לתת' : '🔍 לבקש'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title + category */}
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.category}>{CATEGORY_LABELS[post.category]}</Text>

          {/* Condition / Urgency */}
          {isGive && post.itemCondition && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>מצב: </Text>
              <Text style={styles.conditionValue}>
                {{ New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני' }[post.itemCondition]}
              </Text>
            </View>
          )}
          {!isGive && post.urgency && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>⚡ דחיפות: </Text>
              <Text style={styles.conditionValue}>{post.urgency}</Text>
            </View>
          )}

          {/* Description */}
          {post.description && (
            <Text style={styles.description}>{post.description}</Text>
          )}

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>

          {/* Time */}
          <Text style={styles.timeText}>{timeAgo}</Text>

          <View style={styles.divider} />

          {/* Author */}
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push(`/user/${post.ownerHandle}`)}
          >
            <AvatarInitials name={post.ownerName} avatarUrl={post.ownerAvatarUrl} size={44} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.ownerName}</Text>
              <Text style={styles.authorCity}>{post.address.cityName}</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
          <Text style={styles.messageBtnText}>💬 שלח הודעה למפרסם</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followBtnText}>עקוב</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imagePlaceholder: {
    height: 240,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderEmoji: { fontSize: 72 },
  typeTagOverlay: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: { ...typography.label, color: colors.textPrimary },
  content: {
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  category: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  conditionRow: { flexDirection: 'row', alignItems: 'center' },
  conditionLabel: { ...typography.body, color: colors.textSecondary },
  conditionValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
    textAlign: 'right',
    paddingTop: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  locationText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
  timeText: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  authorCity: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  cta: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: { ...typography.button, color: colors.textInverse },
  followBtn: {
    height: 50,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtnText: { ...typography.button, color: colors.textPrimary },
});
