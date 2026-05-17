import { useTranslation } from 'react-i18next';
import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { colors, spacing, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { PostCardGrid } from './PostCardGrid';
import { EmptyState } from './EmptyState';
import { WebPullToRefresh } from './WebPullToRefresh';

interface Props {
  data: PostWithOwner[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  /** Override card-tap handler (used by guest feed for the join modal). */
  onCardPress?: (post: PostWithOwner) => void;
  /** Optional override for the empty state — Home Feed passes the warm empty state. */
  emptyComponent?: React.ReactNode;
  /** Optional sticky/scrollable banner rendered above the list. */
  ListHeaderComponent?: React.ReactNode;
  /** Forwarded to the underlying FlatList — used by the feed for scroll-to-top. */
  listRef?: React.Ref<FlatList<PostWithOwner>>;
}

export function PostFeedList({
  data,
  isLoading,
  isRefetching,
  isError,
  onRefresh,
  onRetry,
  onEndReached,
  hasMore,
  onCardPress,
  emptyComponent,
  ListHeaderComponent,
  listRef,
}: Props) {
  const { t } = useTranslation();
  // RN-Web ignores `RefreshControl`; track scroll Y so `WebPullToRefresh` can
  // arm only when the user is at the top. `useRef` (not state) avoids a
  // re-render on every scroll frame.
  const scrollYRef = useRef(0);
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (isError && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{t('feed.loadErrorTitle')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>{t('general.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const list = (
    <FlatList
      ref={listRef}
      data={data ?? []}
      keyExtractor={(p) => p.postId}
      numColumns={2}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <PostCardGrid
          post={item}
          onPressOverride={onCardPress ? () => onCardPress(item) : undefined}
        />
      )}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent as React.ComponentType | null | undefined}
      ListEmptyComponent={
        (emptyComponent as React.ReactElement) ?? (
          <EmptyState
            icon="search-outline"
            title={t('feed.noResults')}
            subtitle={t('feed.noResultsDesc')}
          />
        )
      }
      ListFooterComponent={
        hasMore && data && data.length > 0 ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
      // Native: `RefreshControl` drives FR-FEED-010 AC1 pull-to-refresh.
      // Web: ignored by RN-Web — `WebPullToRefresh` below owns the gesture.
      refreshControl={
        Platform.OS !== 'web' ? (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onScroll={Platform.OS === 'web' ? handleScroll : undefined}
      scrollEventThrottle={Platform.OS === 'web' ? 16 : undefined}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
    />
  );
  if (Platform.OS === 'web') {
    return (
      <WebPullToRefresh
        onRefresh={onRefresh}
        isRefreshing={isRefetching}
        getScrollY={() => scrollYRef.current}
      >
        {list}
      </WebPullToRefresh>
    );
  }
  return list;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.base },
  errorTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  retryText: { ...typography.button, color: colors.textInverse },
  row: { paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  listContent: { paddingTop: spacing.base, paddingBottom: spacing['3xl'] },
  footer: { paddingVertical: spacing.base, alignItems: 'center' },
});
