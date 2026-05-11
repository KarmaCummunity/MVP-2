import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, I18nManager, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { CATEGORY_LABELS } from '@kc/domain';
import { AvatarInitials } from './AvatarInitials';

const isRTL = I18nManager.isRTL;
const isWeb = Platform.OS === 'web';
const alignStart: any = isWeb ? (isRTL ? 'right' : 'left') : 'left';
interface PostCardProps {
  post: PostWithOwner;
  onMessagePress?: () => void;
  /** When set, card tap invokes this instead of navigating to post detail (guest preview). */
  onPressOverride?: () => void;
}

export function PostCard({ post, onMessagePress, onPressOverride }: PostCardProps) {
  const router = useRouter();

  const isGive = post.type === 'Give';

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: dateFnsHe,
  });

  const locationText = (() => {
    if (post.locationDisplayLevel === 'CityOnly') return post.address.cityName;
    if (post.locationDisplayLevel === 'CityAndStreet')
      return `${post.address.cityName}, ${post.address.street}`;
    return `${post.address.cityName}, ${post.address.street} ${post.address.streetNumber}`;
  })();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        onPressOverride ? onPressOverride() : router.push(`/post/${post.postId}`)
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <AvatarInitials
            name={post.ownerName}
            avatarUrl={post.ownerAvatarUrl}
            size={36}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.ownerName}</Text>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
        </View>

        {/* Type tag */}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? '🎁 לתת' : '🔍 לבקש'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      {/* Description */}
      {post.description ? (
        <Text style={styles.description} numberOfLines={2}>{post.description}</Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Text style={styles.categoryText}>
            {CATEGORY_LABELS[post.category]}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.locationText}>📍 {locationText}</Text>
        </View>

        {/* Action buttons */}
        {onMessagePress && (
          <TouchableOpacity style={styles.messageBtn} onPress={onMessagePress}>
            <Text style={styles.messageBtnText}>💬</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Visibility badge for own posts */}
      {post.visibility === 'FollowersOnly' && (
        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityText}>👥 לעוקבים בלבד</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  authorInfo: {
    marginRight: spacing.sm,
    flex: 1,
  },
  authorName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: alignStart,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: alignStart,
  },
  typeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  giveTag: {
    backgroundColor: colors.giveTagBg,
  },
  requestTag: {
    backgroundColor: colors.requestTagBg,
  },
  typeTagText: {
    ...typography.label,
  },
  giveTagText: {
    color: colors.giveTag,
  },
  requestTagText: {
    color: colors.requestTag,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: alignStart,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: alignStart,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dot: {
    color: colors.textDisabled,
    marginHorizontal: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  messageBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: 16,
  },
  visibilityBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  visibilityText: {
    ...typography.caption,
    color: colors.followersOnlyBadge,
  },
});
