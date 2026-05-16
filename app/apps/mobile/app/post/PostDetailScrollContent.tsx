import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { PostImageCarousel } from '../../src/components/PostImageCarousel';
import { PostMenuButton } from '../../src/components/post/PostMenuButton';
import { RecipientCallout } from '../../src/components/post-detail/RecipientCallout';
import { RecipientUnmarkBar } from '../../src/components/post-detail/RecipientUnmarkBar';
import { PostActorPrivacyBar } from '../../src/components/post-detail/PostActorPrivacyBar';
import { MotionEntry, ENTRY_DELAY } from '../../src/components/ui/MotionEntry';
import { styles } from './postDetailScreen.styles';

export type PostDetailScrollContentProps = Readonly<{
  post: PostWithOwner;
  isGive: boolean;
  showActorPrivacy: boolean;
  viewerId: string | null;
  ownerNavigable: boolean;
  ownerLabel: string;
  locationText: string;
  timeAgo: string;
}>;

export function PostDetailScrollContent({
  post,
  isGive,
  showActorPrivacy,
  viewerId,
  ownerNavigable,
  ownerLabel,
  locationText,
  timeAgo,
}: PostDetailScrollContentProps) {
  const { t } = useTranslation();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <MotionEntry variant="hero" delay={ENTRY_DELAY.hero}>
        <View style={styles.imageWrap}>
          <PostImageCarousel
            mediaAssets={post.mediaAssets}
            fallbackIcon={isGive ? 'gift-outline' : 'search-outline'}
          />
          <View style={[styles.typeTagOverlay, isGive ? styles.giveTag : styles.requestTag]}>
            <Text style={styles.typeTagText}>{isGive ? t('post.detail.typeGiveLabel') : t('post.detail.typeRequestLabel')}</Text>
          </View>
          <View style={styles.menuOverlay} pointerEvents="box-none">
            <PostMenuButton post={post} />
          </View>
        </View>
      </MotionEntry>

      <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
        <View style={styles.content}>
          <Text style={styles.category}>{t(`post.category.${post.category}`)}</Text>
          <Text style={styles.title}>{post.title}</Text>

          {isGive && post.itemCondition != null ? (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>{t('post.detail.conditionPrefix')}</Text>
              <Text style={styles.conditionValue}>{t(`post.condition.${post.itemCondition}`)}</Text>
            </View>
          ) : null}
          {!isGive && post.urgency != null && post.urgency !== '' ? (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>{t('post.detail.urgencyPrefix')}</Text>
              <Text style={styles.conditionValue}>{post.urgency}</Text>
            </View>
          ) : null}

          {post.description != null && post.description !== '' ? (
            <Text style={styles.description}>{post.description}</Text>
          ) : null}

          <ClosedDeliveredExtras post={post} viewerId={viewerId} />

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo}</Text>

          <View style={styles.divider} />
          <PostDetailAuthorFooter
            ownerNavigable={ownerNavigable}
            ownerLabel={ownerLabel}
            ownerAvatarUrl={post.ownerAvatarUrl}
            cityName={post.address.cityName}
            ownerHandle={post.ownerHandle}
          />
          {showActorPrivacy && viewerId != null ? (
            <PostActorPrivacyBar post={post} viewerId={viewerId} />
          ) : null}
        </View>
      </MotionEntry>
    </ScrollView>
  );
}

function ClosedDeliveredExtras(
  props: Readonly<{
    post: PostWithOwner;
    viewerId: string | null;
  }>,
) {
  const { post, viewerId } = props;
  if (post.status === 'closed_delivered') {
    return (
      <>
        {post.recipientUser != null && (
          <RecipientCallout
            postType={post.type}
            recipient={post.recipientUser}
            profileNavigable={(post.recipientProfileNavigableFromPost ?? true) === true}
          />
        )}
        {post.recipient?.recipientUserId === viewerId && viewerId != null ? (
          <RecipientUnmarkBar postId={post.postId} userId={viewerId} />
        ) : null}
      </>
    );
  }
  return null;
}

function PostDetailAuthorFooter(
  props: Readonly<{
    ownerNavigable: boolean;
    ownerLabel: string;
    ownerAvatarUrl: string | null;
    cityName: string;
    ownerHandle: string;
  }>,
) {
  const router = useRouter();
  const { ownerNavigable, ownerLabel, ownerAvatarUrl, cityName, ownerHandle } = props;
  const core = (
    <>
      <AvatarInitials name={ownerLabel} avatarUrl={ownerAvatarUrl} size={44} />
      <View style={styles.authorInfo}>
        <Text style={styles.authorName}>{ownerLabel}</Text>
        <Text style={styles.authorCity}>{cityName}</Text>
      </View>
    </>
  );
  if (ownerNavigable) {
    return (
      <TouchableOpacity style={styles.authorRow} onPress={() => router.push(`/user/${ownerHandle}`)}>
        {core}
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }
  return <View style={styles.authorRow}>{core}</View>;
}
