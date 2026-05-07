// app/apps/mobile/src/components/PostCardGrid.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 2 columns, spacing.base (16) padding on each side, spacing.sm (8) gap between columns
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

interface PostCardGridProps {
  post: PostWithOwner;
  onPressOverride?: () => void;
}

export function PostCardGrid({ post, onPressOverride }: PostCardGridProps) {
  const router = useRouter();
  const isGive = post.type === 'Give';

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: dateFnsHe,
  });

  const locationText = post.locationDisplayLevel === 'CityOnly'
    ? post.address.cityName
    : `${post.address.cityName}, ${post.address.street}`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        onPressOverride ? onPressOverride() : router.push(`/post/${post.postId}`)
      }
    >
      {/* Image / icon area */}
      <View style={styles.imageArea}>
        <Text style={styles.categoryIcon}>
          {isGive ? '🎁' : '🔍'}
        </Text>
        {/* Type tag overlay */}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? 'לתת' : 'לבקש'}
          </Text>
        </View>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {post.ownerName} · {timeAgo}
        </Text>
        <Text style={styles.location} numberOfLines={1}>📍 {locationText}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageArea: {
    width: '100%',
    height: CARD_WIDTH * 0.7,
    backgroundColor: colors.skeleton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 36,
  },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: {
    ...typography.label,
    fontSize: 10,
  },
  giveTagText: { color: colors.giveTag },
  requestTagText: { color: colors.requestTag },
  content: {
    padding: spacing.sm,
    gap: 2,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    fontSize: 13,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
