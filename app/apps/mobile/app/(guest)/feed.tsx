// Guest preview feed — FR-AUTH-014 (screen 1.7) — wired to live IPostRepository (P0.4-FE).
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { selectGuestPreviewPosts } from '@kc/application';
import { colors, typography, spacing, radius } from '@kc/ui';
import { PostCard } from '../../src/components/PostCard';
import { GuestJoinModal } from '../../src/components/GuestJoinModal';
import { FeedCommunityCounter } from '../../src/components/FeedCommunityCounter';
import { useAuthStore } from '../../src/store/authStore';
import { getFeedUseCase } from '../../src/services/postsComposition';

export default function GuestPreviewFeedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const setGuest = useAuthStore((s) => s.setGuest);
  const [modalVisible, setModalVisible] = useState(false);

  // limit=6 leaves a small buffer in case the feed includes non-public/closed posts
  // that `selectGuestPreviewPosts` filters out; the selector caps display at 3 (FR-AUTH-014 AC1).
  const query = useQuery({
    queryKey: ['guest-feed'],
    queryFn: () => getFeedUseCase().execute({ viewerId: null, filter: {}, limit: 6 }),
  });
  const posts = useMemo(
    () => selectGuestPreviewPosts(query.data?.posts ?? []),
    [query.data?.posts],
  );

  const goAuth = () => {
    setGuest(false);
    setModalVisible(false);
    router.replace('/(auth)');
  };

  const goWelcome = () => {
    setGuest(false);
    router.replace('/(auth)');
  };

  const openGate = () => setModalVisible(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goWelcome}
          accessibilityLabel={t('auth.guestPreviewBackA11y')}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-forward' : 'arrow-forward'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('feed.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {query.isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('feed.noResults')}</Text>
          }
          renderItem={({ item }) => (
            <PostCard post={item} onPressOverride={openGate} />
          )}
        />
      )}

      <View style={[styles.bottomBar, { paddingBottom: spacing.lg + insets.bottom }]}>
        <FeedCommunityCounter
          template={(n) => t('feed.guestBannerWithCount', { count: n })}
          style={styles.bottomHint}
        />
        <TouchableOpacity style={styles.bottomCta} onPress={goAuth} activeOpacity={0.9}>
          <Text style={styles.bottomCtaText}>{t('feed.joinNow')}</Text>
        </TouchableOpacity>
      </View>

      <GuestJoinModal
        visible={modalVisible}
        message={t('feed.guestBanner')}
        joinLabel={t('feed.joinNow')}
        onJoin={goAuth}
        onDismiss={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerSpacer: { width: 40 },
  list: { paddingTop: spacing.md, paddingBottom: 160 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xl },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bottomHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  bottomCta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bottomCtaText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
