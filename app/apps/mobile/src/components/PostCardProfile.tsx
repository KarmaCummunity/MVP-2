// app/apps/mobile/src/components/PostCardProfile.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 3 columns, spacing.base (16) padding each side, spacing.xs (4) gap × 2
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.xs * 2) / 3;

interface PostCardProfileProps {
  post: PostWithOwner;
  onPressOverride?: () => void;
}

export function PostCardProfile({ post, onPressOverride }: PostCardProfileProps) {
  const router = useRouter();
  const isGive = post.type === 'Give';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        onPressOverride ? onPressOverride() : router.push(`/post/${post.postId}`)
      }
    >
      {/* Square image / icon area */}
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

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
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
  },
  categoryIcon: {
    fontSize: 24,
  },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
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
  title: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'right',
    padding: spacing.xs,
  },
});
