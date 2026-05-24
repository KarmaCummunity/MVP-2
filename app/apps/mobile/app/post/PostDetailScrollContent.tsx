import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { PostImageCarousel } from '../../src/components/PostImageCarousel';
import { PostDetailStatusBadge } from '../../src/components/post-detail/PostDetailStatusBadge';
import { RecipientCallout } from '../../src/components/post-detail/RecipientCallout';
import { RecipientUnmarkBar } from '../../src/components/post-detail/RecipientUnmarkBar';
import { MotionEntry, ENTRY_DELAY } from '../../src/components/ui/MotionEntry';
import { usePostDetailStyles } from './postDetailScreen.styles';

export type PostDetailScrollContentProps = Readonly<{
  post: PostWithOwner;
  isGive: boolean;
  viewerId: string | null;
  ownerNavigable: boolean;
  ownerLabel: string;
  locationText: string;
  timeAgo: string;
  scrollBottomInset: number;
}>;

export function PostDetailScrollContent({
  post,
  isGive,
  viewerId,
  ownerNavigable,
  ownerLabel,
  locationText,
  timeAgo,
  scrollBottomInset,
}: PostDetailScrollContentProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = usePostDetailStyles();
  const isClosed = post.status === 'closed_delivered';
  const isOpen = post.status === 'open';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={scrollBottomInset > 0 ? { paddingBottom: scrollBottomInset } : undefined}
    >
      <MotionEntry variant="hero" delay={ENTRY_DELAY.hero}>
        <View style={[styles.imageWrap, isClosed ? styles.imageWrapClosed : null]}>
          <PostImageCarousel
            mediaAssets={post.mediaAssets}
            fallbackIcon={isGive ? 'gift-outline' : 'search-outline'}
          />
          {isClosed ? <View style={styles.closedImageTint} pointerEvents="none" /> : null}
          <View style={styles.statusBadgePos}>
            <PostDetailStatusBadge status={post.status} />
          </View>
          <View style={styles.typeTagOverlay}>
            <Text style={isGive ? styles.giveTagText : styles.requestTagText}>
              {isGive ? t('post.detail.typeGiveLabel') : t('post.detail.typeRequestLabel')}
            </Text>
          </View>
        </View>
      </MotionEntry>

      <MotionEntry variant="bottom" delay={ENTRY_DELAY.section}>
        <View style={[styles.content, isClosed ? styles.contentClosed : null]}>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{t(`post.category.${post.category}`)}</Text>
              </View>
              <Text style={styles.title}>{post.title}</Text>
            </View>
          </View>

          <MetaChips post={post} isGive={isGive} />

          {isClosed ? <ClosedDeliveredExtras post={post} viewerId={viewerId} /> : null}

          {post.description != null && post.description !== '' ? (
            <Text style={styles.description}>{post.description}</Text>
          ) : null}

          {isOpen ? (
            <View style={styles.metaChip}>
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
              <Text style={styles.metaChipText}>{t('post.detail.statusOpenHint')}</Text>
            </View>
          ) : null}

          <View style={styles.metaSection}>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.locationText}>{locationText}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>

          <View style={styles.authorCard}>
            <Text style={styles.authorLabel}>{t('post.detail.publishedBy')}</Text>
            <PostDetailAuthorFooter
              ownerNavigable={ownerNavigable}
              ownerLabel={ownerLabel}
              ownerAvatarUrl={post.ownerAvatarUrl}
              cityName={post.address.cityName}
              ownerHandle={post.ownerHandle}
            />
          </View>
        </View>
      </MotionEntry>
    </ScrollView>
  );
}

function MetaChips(props: Readonly<{ post: PostWithOwner; isGive: boolean }>) {
  const { post, isGive } = props;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = usePostDetailStyles();

  const chips: React.ReactNode[] = [];
  if (isGive && post.itemCondition != null) {
    chips.push(
      <View key="condition" style={styles.metaChip}>
        <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.metaChipText}>{t(`post.condition.${post.itemCondition}`)}</Text>
      </View>,
    );
  }
  if (!isGive && post.urgency != null && post.urgency !== '') {
    chips.push(
      <View key="urgency" style={styles.metaChip}>
        <Ionicons name="flash-outline" size={14} color={colors.warning} />
        <Text style={styles.metaChipText}>{post.urgency}</Text>
      </View>,
    );
  }
  if (chips.length === 0) return null;
  return <View style={styles.metaChipsRow}>{chips}</View>;
}

function ClosedDeliveredExtras(
  props: Readonly<{
    post: PostWithOwner;
    viewerId: string | null;
  }>,
) {
  const { post, viewerId } = props;
  return (
    <>
      {post.recipientUser != null ? (
        <RecipientCallout
          postType={post.type}
          recipient={post.recipientUser}
          profileNavigable={(post.recipientProfileNavigableFromPost ?? true) === true}
        />
      ) : null}
      {post.recipient?.recipientUserId === viewerId && viewerId != null ? (
        <RecipientUnmarkBar postId={post.postId} userId={viewerId} />
      ) : null}
    </>
  );
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
  const { colors } = useTheme();
  const styles = usePostDetailStyles();
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
