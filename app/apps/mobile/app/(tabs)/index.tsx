// Home Feed — wired to IPostRepository + IFeedRealtime + IStatsRepository (P1.2).
// Mapped to: FR-FEED-001, 002, 004, 005, 006, 008, 009, 010, 014, 015.
//
// The Home Feed reads its filter from `filterStore` (persisted) and overlays
// session-only banners (new-posts pill, first-post nudge) via
// `feedSessionStore` (in-memory). Realtime INSERTs of public posts bump the
// counter; tapping the pill refetches + scrolls to top.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { PostWithOwner } from '@kc/application';
import { PostFeedList } from '../../src/components/PostFeedList';
import { TopBar } from '../../src/components/TopBar';
import { FeedFilterIcon } from '../../src/components/FeedFilterIcon';
import { WebRefreshButton } from '../../src/components/WebRefreshButton';
import { NewPostsBanner } from '../../src/components/NewPostsBanner';
import { FirstPostNudge } from '../../src/components/FirstPostNudge';
import { FeedEmptyState } from '../../src/components/FeedEmptyState';
import { PostFilterSheet, type PostFilterValue } from '../../src/components/PostFilterSheet';
import { Screen } from '../../src/components/ui/Screen';
import { useAuthStore } from '../../src/store/authStore';
import { useFilterStore } from '../../src/store/filterStore';
import { useFeedSessionStore } from '../../src/store/feedSessionStore';
import { useFeedRealtime } from '../../src/hooks/useFeedRealtime';
import { useFirstPostNudge } from '../../src/hooks/useFirstPostNudge';
import { getFeedUseCase } from '../../src/services/postsComposition';

export default function HomeFeedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const viewerId = session?.userId ?? null;

  const filter = useFilterStore();
  const activeCount = useFilterStore((s) => s.activeCount());
  const newPostsCount = useFeedSessionStore((s) => s.newPostsCount);
  const resetNewPosts = useFeedSessionStore((s) => s.resetNewPosts);

  const [sheetOpen, setSheetOpen] = useState(false);
  const listRef = useRef<FlatList<PostWithOwner>>(null);

  const feedFilter = useMemo(
    () => ({
      type: filter.type ?? undefined,
      categories: filter.categories,
      itemConditions: filter.itemConditions,
      locationFilter: filter.locationFilter ?? undefined,
      statusFilter: filter.statusFilter,
      sortOrder: filter.sortOrder,
      proximitySortCity: filter.proximitySortCity ?? undefined,
      followersOnly: filter.followersOnly,
    }),
    [
      filter.type,
      filter.categories,
      filter.itemConditions,
      filter.locationFilter,
      filter.statusFilter,
      filter.sortOrder,
      filter.proximitySortCity,
      filter.followersOnly,
    ],
  );

  const feedQuery = useQuery({
    queryKey: ['feed', viewerId, feedFilter],
    queryFn: () =>
      getFeedUseCase().execute({ viewerId, filter: feedFilter, limit: 20 }),
  });

  const refetchAndReset = useCallback(() => {
    resetNewPosts();
    void feedQuery.refetch();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [feedQuery, resetNewPosts]);

  const refetchFromToolbarWithToast = useCallback(async () => {
    resetNewPosts();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    const result = await feedQuery.refetch();
    const toast = useFeedSessionStore.getState().showEphemeralToast;
    if (result.isError) {
      toast(t('feed.refreshFailed'), 'error');
    } else {
      toast(t('feed.refreshSuccess'), 'success');
    }
  }, [feedQuery, resetNewPosts, t]);

  useFeedRealtime(refetchAndReset);

  const nudge = useFirstPostNudge(viewerId);

  const sheetInitial: PostFilterValue = {
    type: filter.type,
    categories: filter.categories,
    itemConditions: filter.itemConditions,
    locationFilter: filter.locationFilter,
    statusFilter: filter.statusFilter,
    sortOrder: filter.sortOrder,
    proximitySortCity: filter.proximitySortCity,
    proximitySortCityName: filter.proximitySortCityName,
    followersOnly: filter.followersOnly,
  };
  const handleApply = (next: PostFilterValue) => {
    filter.setType(next.type);
    filter.setCategories(next.categories);
    filter.setItemConditions(next.itemConditions);
    filter.setLocationFilter(next.locationFilter);
    filter.setStatusFilter(next.statusFilter);
    filter.setSortOrder(next.sortOrder);
    filter.setProximitySortCity(next.proximitySortCity, next.proximitySortCityName);
    filter.setFollowersOnly(next.followersOnly);
  };

  const header = (
    <View>
      {nudge.show && (
        <FirstPostNudge
          onShare={() => router.push('/(tabs)/create')}
          onRemindLater={nudge.dismissForSession}
          onDismissForever={nudge.dismissForever}
        />
      )}
      <NewPostsBanner count={newPostsCount} onPress={refetchAndReset} />
    </View>
  );

  return (
    <Screen blobs="content">
      <TopBar
        extraIcon={
          <>
            <WebRefreshButton onPress={refetchFromToolbarWithToast} isLoading={feedQuery.isRefetching} />
            <FeedFilterIcon activeCount={activeCount} onPress={() => setSheetOpen(true)} />
          </>
        }
      />

      <PostFeedList
        listRef={listRef}
        data={feedQuery.data?.posts}
        isLoading={feedQuery.isLoading}
        isRefetching={feedQuery.isRefetching}
        isError={feedQuery.isError}
        onRefresh={refetchAndReset}
        onRetry={() => feedQuery.refetch()}
        hasMore={Boolean(feedQuery.data?.nextCursor)}
        ListHeaderComponent={header}
        emptyComponent={
          <FeedEmptyState
            hasActiveFilters={activeCount > 0}
            onClearFilters={() => filter.clearAll()}
            onShare={() => router.push('/(tabs)/create')}
          />
        }
      />

      <PostFilterSheet
        visible={sheetOpen}
        initial={sheetInitial}
        onApply={handleApply}
        onClear={() => filter.clearAll()}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}
