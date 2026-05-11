// app/apps/mobile/src/components/PostCardGrid.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Image,
  I18nManager, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { CATEGORY_LABELS } from '@kc/domain';
import { getSupabaseClient } from '@kc/infrastructure-supabase';

const STORAGE_BUCKET = 'post-images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 2 columns, spacing.base (16) padding on each side, spacing.sm (8) gap between columns
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

const isRTL = I18nManager.isRTL;
const isWeb = Platform.OS === 'web';
const alignStart: any = isWeb ? (isRTL ? 'right' : 'left') : 'left';
const tagPosition = (isRTL && !isWeb) ? { left: spacing.xs } : { right: spacing.xs };

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

  const firstImageUrl = post.mediaAssets[0]
    ? getSupabaseClient().storage.from(STORAGE_BUCKET).getPublicUrl(post.mediaAssets[0].path).data.publicUrl
    : null;

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
        {firstImageUrl ? (
          <Image source={{ uri: firstImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name={isGive ? 'gift-outline' : 'search-outline'} size={36} color={colors.textSecondary} />
        )}
        {/* Type tag overlay (top-right in RTL) */}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? 'לתת' : 'לבקש'}
          </Text>
        </View>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText} numberOfLines={1}>
              {CATEGORY_LABELS[post.category]}
            </Text>
          </View>
        </View>
        <View style={styles.metaContainer}>
          <Text style={[styles.meta, { flexShrink: 1 }]} numberOfLines={1}>{post.ownerName}</Text>
          <Text style={styles.metaDot}> · </Text>
          <Text style={[styles.meta, { flexShrink: 1 }]} numberOfLines={1}>{timeAgo}</Text>
        </View>
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
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    ...tagPosition,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: alignStart,
    fontSize: 13,
    flex: 1,
  },
  categoryTag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    flexShrink: 0,
  },
  categoryTagText: {
    ...typography.label,
    fontSize: 10,
    color: colors.primary,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: alignStart,
  },
  metaDot: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: alignStart,
  },
});
