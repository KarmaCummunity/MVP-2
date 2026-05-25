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
import type { IdentityRoleForViewedProfile } from '@kc/domain';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { PROFILE_GRID_COLUMNS, usePostGridCardWidth } from '../hooks/useShellContentWidth';
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
  /** Grid density — home feed uses 2; profile grids use 3. */
  columns?: 2 | 3;
  gap?: number;
  /** Closed-posts tab: economic-role badge (giver/receiver). */
  identityRole?: IdentityRoleForViewedProfile;
  /** Forwarded to post detail for D-31 identity projection on closed-posts grids. */
  closedPostsProfileUserId?: string;
}

export function PostCardGrid({
  post,
  onPressOverride,
  columns = 2,
  gap = spacing.sm,
  identityRole,
  closedPostsProfileUserId,
}: PostCardGridProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = usePostCardGridStyles();
  const cardWidth = usePostGridCardWidth(columns, gap);
  const isProfileGrid = columns === PROFILE_GRID_COLUMNS;
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
  const economicRole = identityRole ? deriveEconomicRole(post.type, identityRole) : null;

  const navigateToPost = () => {
    if (onPressOverride) {
      onPressOverride();
      return;
    }
    const q =
      closedPostsProfileUserId != null
        ? `?fromProfile=${encodeURIComponent(closedPostsProfileUserId)}`
        : '';
    router.push(`/post/${post.postId}${q}` as never);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.86}
      onPress={navigateToPost}
    >
      <View style={[styles.imageArea, { height: cardWidth * 0.78, backgroundColor: placeholderBg }]}>
        {firstImageUrl ? (
          <Image source={{ uri: firstImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderTint}>
            <Ionicons
              name={isGive ? 'gift-outline' : 'search-outline'}
              size={isProfileGrid ? 28 : 40}
              color={isGive ? colors.giveTag : colors.secondary}
            />
          </View>
        )}

        <View style={[styles.typePill, isProfileGrid && styles.typePillDense]}>
          <Text
            style={[
              styles.typePillText,
              isGive ? styles.givePillText : styles.requestPillText,
              isProfileGrid && styles.typePillTextDense,
            ]}
          >
            {isGive ? t('feed.giveTypeShort') : t('feed.requestTypeShort')}
          </Text>
        </View>

        {economicRole ? (
          <View style={[styles.roleBadge, isProfileGrid && styles.roleBadgeDense]}>
            <Text style={[styles.roleBadgeText, isProfileGrid && styles.roleBadgeTextDense]}>
              {economicRole === 'giver' ? t('feed.giverBadge') : t('feed.receiverBadge')}
            </Text>
          </View>
        ) : null}

        <View
          style={[styles.menuOverlay, isProfileGrid && styles.menuOverlayDense]}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(e) => e.stopPropagation()}
        >
          <PostMenuButton
            post={post}
            iconColor={OVERLAY_ICON}
            overlaySize={isProfileGrid ? 'compact' : 'default'}
          />
        </View>
      </View>

      <View style={styles.content}>
        {!isProfileGrid ? (
          <View style={styles.authorRow} accessibilityLabel={ownerLabel}>
            <AvatarInitials
              name={ownerLabel}
              avatarUrl={post.ownerAvatarUrl}
              size={OWNER_AVATAR_SIZE}
            />
            <Text style={styles.ownerName} numberOfLines={1}>{ownerLabel}</Text>
          </View>
        ) : null}

        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isProfileGrid && styles.titleDense]}
            numberOfLines={2}
          >
            {post.title}
          </Text>
          <View style={[styles.categoryChip, isProfileGrid && styles.categoryChipDense]}>
            <Text
              style={[styles.categoryChipText, isProfileGrid && styles.categoryChipTextDense]}
              numberOfLines={1}
            >
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

function deriveEconomicRole(
  postType: PostWithOwner['type'],
  identityRole: IdentityRoleForViewedProfile,
): 'giver' | 'receiver' {
  if (identityRole === 'publisher') return postType === 'Give' ? 'giver' : 'receiver';
  return postType === 'Give' ? 'receiver' : 'giver';
}
