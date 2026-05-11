// 3-column thumbnail card used in profile post grids.
// Renders the first uploaded image; falls back to an Ionicons gift/search glyph.
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { Post } from '@kc/domain';
import { CATEGORY_LABELS } from '@kc/domain';
import { getSupabaseClient } from '@kc/infrastructure-supabase';

import { I18nManager, Platform } from 'react-native';

const STORAGE_BUCKET = 'post-images';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;
const isWeb = Platform.OS === 'web';
const alignStart: any = isWeb ? (isRTL ? 'right' : 'left') : 'left';
const tagPosition = (isRTL && !isWeb) ? { left: spacing.xs } : { right: spacing.xs };

// 3 columns, spacing.base (16) padding each side, spacing.xs (4) gap × 2.
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.xs * 2) / 3;

interface PostCardProfileProps {
  post: Post;
  onPressOverride?: () => void;
}

export function PostCardProfile({ post, onPressOverride }: PostCardProfileProps) {
  const router = useRouter();
  const isGive = post.type === 'Give';

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
      <View style={styles.imageArea}>
        {firstImageUrl ? (
          <Image source={{ uri: firstImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name={isGive ? 'gift-outline' : 'search-outline'} size={28} color={colors.textSecondary} />
        )}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? 'לתת' : 'לבקש'}
          </Text>
        </View>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
        <Text style={styles.categoryText} numberOfLines={1}>{CATEGORY_LABELS[post.category]}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageArea: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.skeleton,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    ...tagPosition,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: {
    ...typography.label,
    fontSize: 9,
  },
  giveTagText: { color: colors.giveTag },
  requestTagText: { color: colors.requestTag },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  title: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: alignStart,
    flex: 1,
  },
  categoryText: {
    ...typography.label,
    fontSize: 9,
    color: colors.primary,
    flexShrink: 0,
  },
});
