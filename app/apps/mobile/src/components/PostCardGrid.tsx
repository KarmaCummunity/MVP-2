// app/apps/mobile/src/components/PostCardGrid.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { usePostGridCardWidth } from '../hooks/useShellContentWidth';
import { postOwnerDisplayLabel } from '../lib/postOwnerDisplayLabel';
import { AvatarInitials } from './AvatarInitials';
import { PostMenuButton } from './post/PostMenuButton';
import { usePostCardGridStyles } from './PostCardGrid.styles';

const STORAGE_BUCKET = 'post-images';
const OWNER_AVATAR_SIZE = 24;
const OVERLAY_ICON = '#FFFFFF';

interface PostCardGridProps {
  post: PostWithOwner;
  onPressOverride?: () => void;
}

export function PostCardGrid({ post, onPressOverride }: PostCardGridProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = usePostCardGridStyles();
  const cardWidth = usePostGridCardWidth(2, spacing.sm);
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

  const ownerLabel = postOwnerDisplayLabel(post, t);
  const placeholderBg = isGive ? colors.primarySurface : `${colors.secondary}18`;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.86}
      onPress={() =>
        onPressOverride ? onPressOverride() : router.push(`/post/${post.postId}`)
      }
    >
      <View style={[styles.imageArea, { height: cardWidth * 0.78, backgroundColor: placeholderBg }]}>
        {firstImageUrl ? (
          <Image source={{ uri: firstImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderTint}>
            <Ionicons
              name={isGive ? 'gift-outline' : 'search-outline'}
              size={40}
              color={isGive ? colors.giveTag : colors.secondary}
            />
          </View>
        )}

        <View style={styles.typePill}>
          <Text style={[styles.typePillText, isGive ? styles.givePillText : styles.requestPillText]}>
            {isGive ? t('feed.giveTypeShort') : t('feed.requestTypeShort')}
          </Text>
        </View>

        <View
          style={styles.menuOverlay}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(e) => e.stopPropagation()}
        >
          <PostMenuButton post={post} iconColor={OVERLAY_ICON} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.authorRow} accessibilityLabel={ownerLabel}>
          <AvatarInitials
            name={ownerLabel}
            avatarUrl={post.ownerAvatarUrl}
            size={OWNER_AVATAR_SIZE}
          />
          <Text style={styles.ownerName} numberOfLines={1}>{ownerLabel}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText} numberOfLines={1}>
              {t(`post.category.${post.category}`)}
            </Text>
          </View>
        </View>

        <View style={styles.metaFooter}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
          </View>
          <Text style={styles.timeAgo} numberOfLines={1}>{timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
