// app/apps/mobile/src/components/PostCardGrid.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { CATEGORY_LABELS } from '@kc/domain';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { PostMenuButton } from './post/PostMenuButton';
import { isRtlLayout as isRTL, postCardGridStyles as styles } from './PostCardGrid.styles';

const STORAGE_BUCKET = 'post-images';

interface PostCardGridProps {
  post: PostWithOwner;
  onPressOverride?: () => void;
}

export function PostCardGrid({ post, onPressOverride }: PostCardGridProps) {
  const router = useRouter();
  const { t } = useTranslation();
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
            {isGive ? t('feed.giveTypeShort') : t('feed.requestTypeShort')}
          </Text>
        </View>
        {/* FR-POST-010 AC1 — ⋮ menu on the card, opposite the type tag.
            Claim the touch responder so the wrapping card TouchableOpacity
            doesn't also navigate to the post detail. */}
        <View
          style={styles.menuOverlay}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(e) => e.stopPropagation()}
        >
          <PostMenuButton post={post} />
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
        <Text style={styles.metaContainerText} numberOfLines={1}>
          <Text style={styles.meta}>{post.ownerName ?? t('common.deletedUser')}</Text>
          <Text style={styles.metaDot}> · </Text>
          <Text style={styles.meta}>{timeAgo}</Text>
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {isRTL ? `${locationText}` : `${locationText}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

