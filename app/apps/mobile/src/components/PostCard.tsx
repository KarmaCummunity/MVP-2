import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import type { PostWithOwner } from '@kc/application';
import { AvatarInitials } from './AvatarInitials';
import { styles } from './PostCard.styles';

interface PostCardProps {
  post: PostWithOwner;
  onMessagePress?: () => void;
  /** When set, card tap invokes this instead of navigating to post detail (guest preview). */
  onPressOverride?: () => void;
}

export function PostCard({ post, onMessagePress, onPressOverride }: PostCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

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
            name={post.ownerName ?? t('common.deletedUser')}
            avatarUrl={post.ownerAvatarUrl}
            size={36}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.ownerName ?? t('common.deletedUser')}</Text>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
        </View>

        {/* Type tag */}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? t('feed.giveType') : t('feed.requestType')}
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
            {t(`post.category.${post.category}`)}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.locationText}>📍 {locationText}</Text>
        </View>

        {/* Action buttons */}
        {onMessagePress && post.status === 'open' ? (
          <TouchableOpacity style={styles.messageBtn} onPress={onMessagePress}>
            <Text style={styles.messageBtnText}>💬</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Visibility badge for own posts */}
      {post.visibility === 'FollowersOnly' && (
        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityText}>{t('feed.followersTag')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
