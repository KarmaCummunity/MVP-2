// Post detail — wired to live IPostRepository (P0.4-FE).
// Mapped to: FR-POST-014, FR-POST-015, FR-CHAT-004, FR-CHAT-005. Closes TD-32 / AUDIT-P2-09.
import React from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, radius, spacing, typography } from '@kc/ui';
import { CATEGORY_LABELS } from '@kc/domain';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';
import { PostImageCarousel } from '../../src/components/PostImageCarousel';
import { useAuthStore } from '../../src/store/authStore';
import { getPostByIdUseCase } from '../../src/services/postsComposition';
import { contactPoster } from '../../src/lib/contactPoster';
import { OwnerActionsBar } from '../../src/components/closure/OwnerActionsBar';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);

  const query = useQuery({
    queryKey: ['post', id, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: id ?? '', viewerId }),
    enabled: Boolean(id),
  });

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
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסט</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
          <Text style={styles.retryText}>נסה שוב</Text>
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
          title="הפוסט לא נמצא"
          subtitle="ייתכן שהוא נסגר או שאין לך הרשאה לצפייה."
        />
      </SafeAreaView>
    );
  }

  // FR-POST-015 AC1: owner sees owner-mode controls (Edit / Mark Delivered /
  // Delete arrive with P0.6); the viewer's "Send Message to Poster" CTA must
  // not be shown to the owner — tapping it would create a chat with self.
  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const isGive = post.type === 'Give';
  const locationText = (() => {
    if (post.locationDisplayLevel === 'CityOnly') return post.address.cityName;
    if (post.locationDisplayLevel === 'CityAndStreet')
      return `${post.address.cityName}, רחוב ${post.address.street}`;
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
            <Text style={styles.typeTagText}>{isGive ? 'לתת' : 'לבקש'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.category}>{CATEGORY_LABELS[post.category]}</Text>

          {isGive && post.itemCondition && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>מצב: </Text>
              <Text style={styles.conditionValue}>
                {{ New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני' }[post.itemCondition]}
              </Text>
            </View>
          )}
          {!isGive && post.urgency && (
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>⚡ דחיפות: </Text>
              <Text style={styles.conditionValue}>{post.urgency}</Text>
            </View>
          )}

          {post.description && <Text style={styles.description}>{post.description}</Text>}

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
            <AvatarInitials name={post.ownerName} avatarUrl={post.ownerAvatarUrl} size={44} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.ownerName}</Text>
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
          onAfterMutation={() => void query.refetch()}
        />
      ) : !isOwner ? (
        <View style={styles.cta}>
          <TouchableOpacity style={styles.messageBtn} onPress={() => contactPoster(viewerId, post, router)}>
            <Text style={styles.messageBtnText}>💬 שלח הודעה למפרסם</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.base },
  errorTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 999 },
  retryText: { ...typography.button, color: colors.textInverse },
  imageWrap: { position: 'relative' },
  typeTagOverlay: {
    position: 'absolute', bottom: spacing.base, right: spacing.base,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: { ...typography.label, color: colors.textPrimary },
  content: { padding: spacing.base, gap: spacing.sm, backgroundColor: colors.surface },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  category: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  conditionRow: { flexDirection: 'row', alignItems: 'center' },
  conditionLabel: { ...typography.body, color: colors.textSecondary },
  conditionValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  description: { ...typography.body, color: colors.textPrimary, lineHeight: 24, textAlign: 'right', paddingTop: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  locationText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
  timeText: { ...typography.caption, color: colors.textDisabled, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  authorCity: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  cta: { flexDirection: 'row', padding: spacing.base, gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  messageBtn: { flex: 1, height: 50, backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  messageBtnText: { ...typography.button, color: colors.textInverse },
});
