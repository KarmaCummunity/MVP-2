// Post detail — wired to live IPostRepository (P0.4-FE).
// Mapped to: FR-POST-014, FR-POST-015, FR-POST-021, FR-CHAT-004, FR-CHAT-005. Closes TD-32 / AUDIT-P2-09.
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuthStore } from '../../src/store/authStore';
import { getPostByIdUseCase } from '../../src/services/postsComposition';
import { contactPoster } from '../../src/lib/contactPoster';
import { useFeedSessionStore } from '../../src/store/feedSessionStore';
import { OwnerActionsBar } from '../../src/components/closure/OwnerActionsBar';
import { PostDetailScrollContent } from './PostDetailScrollContent';
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

  // FR-POST-015 AC1: owner-mode CTAs vs viewer's "Send Message to Poster" (FR-POST-014 AC6: open only).
  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const isGive = post.type === 'Give';
  const locationText = (() => {
    if (post.locationDisplayLevel === 'CityOnly') return post.address.cityName;
    if (post.locationDisplayLevel === 'CityAndStreet')
      return `${post.address.cityName}, ${t('post.detail.streetPrefix')} ${post.address.street}`;
    return `${post.address.cityName}, ${post.address.street} ${post.address.streetNumber}`;
  })();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: dateFnsHe });

  const showViewerContactCta = !isOwner && post.status === 'open';

  const isRecipientMarked =
    viewerId != null && post.recipient?.recipientUserId === viewerId;
  const showActorPrivacy =
    viewerId != null && (isOwner || (post.status === 'closed_delivered' && isRecipientMarked));
  const ownerNavigable = post.ownerProfileNavigableFromPost !== false;
  const ownerLabel = ownerNavigable
    ? (post.ownerName ?? t('common.deletedUser'))
    : t('post.detail.anonymousUser');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <PostDetailScrollContent
        post={post}
        isGive={isGive}
        showActorPrivacy={showActorPrivacy}
        viewerId={viewerId}
        ownerNavigable={ownerNavigable}
        ownerLabel={ownerLabel}
        locationText={locationText}
        timeAgo={timeAgo}
      />

      {isOwner && viewerId ? (
        <OwnerActionsBar
          post={post}
          ownerId={viewerId}
          // onClosed / onReopened: toast + leave detail (lists invalidated in OwnerActionsBar).
          onClosed={() => exitAfterOwnerMutation('closure.detailCloseSuccessToast')}
          onReopened={() => exitAfterOwnerMutation('closure.detailReopenSuccessToast')}
        />
      ) : null}
      {showViewerContactCta ? (
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

