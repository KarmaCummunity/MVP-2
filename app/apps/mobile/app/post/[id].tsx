// Post detail — wired to live IPostRepository (P0.4-FE).
// Mapped to: FR-POST-014, FR-POST-015, FR-CHAT-004, FR-CHAT-005. Closes TD-32 / AUDIT-P2-09.
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';
import { PostImageCarousel } from '../../src/components/PostImageCarousel';
import { useAuthStore } from '../../src/store/authStore';
import { getPostByIdUseCase } from '../../src/services/postsComposition';
import { contactPoster } from '../../src/lib/contactPoster';
import { useFeedSessionStore } from '../../src/store/feedSessionStore';
import { OwnerActionsBar } from '../../src/components/closure/OwnerActionsBar';
import { PostMenuButton } from '../../src/components/post/PostMenuButton';
import { RecipientCallout } from '../../src/components/post-detail/RecipientCallout';
import { RecipientUnmarkBar } from '../../src/components/post-detail/RecipientUnmarkBar';
import { styles } from './postDetailScreen.styles';

function normalizeRoutePostId(raw: string | string[] | undefined): string | undefined {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
  return trimmed;
}

export default function PostDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>();
  const postIdParam = normalizeRoutePostId(rawId);
  const router = useRouter();
  const { t } = useTranslation();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);

  const query = useQuery({
    queryKey: ['post', postIdParam, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: postIdParam ?? '', viewerId }),
    enabled: Boolean(postIdParam),
  });

  const exitAfterOwnerMutation = (messageKey: 'closure.detailCloseSuccessToast' | 'closure.detailReopenSuccessToast') => {
    useFeedSessionStore.getState().showEphemeralToast(t(messageKey), 'success', 2200);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{t('post.detail.loadErrorTitle')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
          <Text style={styles.retryText}>{t('post.detail.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const post = query.data?.post;
  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="search-outline"
          title={t('post.detail.notFoundTitle')}
          subtitle={t('post.detail.notFoundSubtitle')}
        />
      </SafeAreaView>
    );
  }

  // FR-POST-015 AC1: owner-mode CTAs vs viewer's "Send Message to Poster".
  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const isGive = post.type === 'Give';
  const locationText = (() => {
    if (post.locationDisplayLevel === 'CityOnly') return post.address.cityName;
    if (post.locationDisplayLevel === 'CityAndStreet')
      return `${post.address.cityName}, ${t('post.detail.streetPrefix')} ${post.address.street}`;
    return `${post.address.cityName}, ${post.address.street} ${post.address.streetNumber}`;
  })();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: dateFnsHe });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <PostImageCarousel
            mediaAssets={post.mediaAssets}
            fallbackIcon={isGive ? 'gift-outline' : 'search-outline'}
          />
          <View style={[styles.typeTagOverlay, isGive ? styles.giveTag : styles.requestTag]}>
            <Text style={styles.typeTagText}>{isGive ? t('post.detail.typeGiveLabel') : t('post.detail.typeRequestLabel')}</Text>
          </View>
          {/* FR-POST-014 AC4 + FR-POST-015 AC1 + FR-ADMIN-009 — ⋮ menu (overlay, not Stack header). */}
          <View style={styles.menuOverlay} pointerEvents="box-none">
            <PostMenuButton post={post} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.category}>{t(`post.category.${post.category}`)}</Text>

          {isGive && post.itemCondition && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>{t('post.detail.conditionPrefix')}</Text>
              <Text style={styles.conditionValue}>{t(`post.condition.${post.itemCondition}`)}</Text>
            </View>
          )}
          {!isGive && post.urgency && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>{t('post.detail.urgencyPrefix')}</Text>
              <Text style={styles.conditionValue}>{post.urgency}</Text>
            </View>
          )}

          {post.description && <Text style={styles.description}>{post.description}</Text>}

          {post.status === 'closed_delivered' && post.recipientUser ? (
            <RecipientCallout postType={post.type} recipient={post.recipientUser} />
          ) : null}
          {post.status === 'closed_delivered' && post.recipient?.recipientUserId === viewerId && viewerId != null
            ? <RecipientUnmarkBar postId={post.postId} userId={viewerId} />
            : null}

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo}</Text>

          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push(`/user/${post.ownerHandle}`)}
          >
            <AvatarInitials name={post.ownerName ?? t('common.deletedUser')} avatarUrl={post.ownerAvatarUrl} size={44} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.ownerName ?? t('common.deletedUser')}</Text>
              <Text style={styles.authorCity}>{post.address.cityName}</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isOwner && viewerId ? (
        <OwnerActionsBar
          post={post}
          ownerId={viewerId}
          // onClosed / onReopened: toast + leave detail (lists invalidated in OwnerActionsBar).
          onClosed={() => exitAfterOwnerMutation('closure.detailCloseSuccessToast')}
          onReopened={() => exitAfterOwnerMutation('closure.detailReopenSuccessToast')}
        />
      ) : !isOwner ? (
        <View style={styles.cta}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => contactPoster(viewerId, post, router)}
            accessibilityRole="button"
            accessibilityLabel={t('post.detail.contactA11y')}
          >
            <Text style={styles.messageBtnText}>{t('post.detail.contactCta')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

