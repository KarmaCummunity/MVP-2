// Home Feed — wired to IPostRepository + IFeedRealtime + IStatsRepository (P1.2).
// Mapped to: FR-FEED-001, 002, 003, 004, 005, 006, 008, 009, 010, 014, 015.
//
// The Home Feed reads its filter from `filterStore` (persisted) and overlays
// session-only banners (new-posts pill, first-post nudge) via
// `feedSessionStore` (in-memory). Realtime INSERTs of public posts bump the
// counter; tapping the pill refetches + scrolls to top.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import type { PostWithOwner } from '@kc/application';
import { PostFeedList } from '../../src/components/PostFeedList';
import { TopBar } from '../../src/components/TopBar';
import { FeedFilterIcon } from '../../src/components/FeedFilterIcon';
import { NewPostsBanner } from '../../src/components/NewPostsBanner';
import { FirstPostNudge } from '../../src/components/FirstPostNudge';
import { SurveyPromptBanner } from '../../src/components/survey/SurveyPromptBanner';
import { useSurveyBanner } from '../../src/hooks/useSurveyBanner';
import { FeedEmptyState } from '../../src/components/FeedEmptyState';
import { PostFilterSheet, type PostFilterValue } from '../../src/components/PostFilterSheet';
import { Screen } from '../../src/components/ui/Screen';
import { useAuthStore } from '../../src/store/authStore';
import { useFilterStore } from '../../src/store/filterStore';
import { useFeedSessionStore } from '../../src/store/feedSessionStore';
import { useFeedRealtime } from '../../src/hooks/useFeedRealtime';
import { useFirstPostNudge } from '../../src/hooks/useFirstPostNudge';
import { getFeedUseCase } from '../../src/services/postsComposition';
import { startMark } from '../../src/lib/observability/perfMarks';

// Module-scope guard: fires once per JS context (cold home-tab mount).
let feedFirstRenderStarted = false;
if (!feedFirstRenderStarted) {
  feedFirstRenderStarted = true;
  startMark('feed.first_render');
  startMark('image.first_paint');
}

export default function HomeFeedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const viewerId = session?.userId ?? null;

  const filter = useFilterStore(
    useShallow((s) => ({
      type: s.type,
      categories: s.categories,
      itemConditions: s.itemConditions,
      locationFilter: s.locationFilter,
      statusFilter: s.statusFilter,
      sortOrder: s.sortOrder,
      proximitySortCity: s.proximitySortCity,
      proximitySortCityName: s.proximitySortCityName,
      followersOnly: s.followersOnly,
      searchQuery: s.searchQuery,
      setType: s.setType,
      setCategories: s.setCategories,
      setItemConditions: s.setItemConditions,
      setLocationFilter: s.setLocationFilter,
      setStatusFilter: s.setStatusFilter,
      setSortOrder: s.setSortOrder,
      setProximitySortCity: s.setProximitySortCity,
      setFollowersOnly: s.setFollowersOnly,
      setSearchQuery: s.setSearchQuery,
      clearAll: s.clearAll,
    })),
  );
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
      searchQuery:
        filter.searchQuery.trim().length >= 2 ? filter.searchQuery.trim() : undefined,
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
      filter.searchQuery,
    ],
  );

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed', viewerId, feedFilter],
    queryFn: ({ pageParam }) =>
      getFeedUseCase().execute({
        viewerId,
        filter: feedFilter,
        limit: 20,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const feedPosts = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.posts) ?? [],
    [feedQuery.data?.pages],
  );

  const refetchAndReset = useCallback(() => {
    resetNewPosts();
    void feedQuery.refetch();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [feedQuery, resetNewPosts]);

  useFeedRealtime({
    queryClient,
    queryKey: ['feed', viewerId, feedFilter] as const,
    viewerId,
    feedFilter,
  });

  const nudge = useFirstPostNudge(viewerId);
  const surveyBanner = useSurveyBanner();

  const sheetValue: PostFilterValue = {
    type: filter.type,
    categories: filter.categories,
    itemConditions: filter.itemConditions,
    locationFilter: filter.locationFilter,
    statusFilter: filter.statusFilter,
    sortOrder: filter.sortOrder,
    proximitySortCity: filter.proximitySortCity,
    proximitySortCityName: filter.proximitySortCityName,
    followersOnly: filter.followersOnly,
    searchQuery: filter.searchQuery,
  };

  // Stable callback — zustand actions via getState() so SearchSection debounce
  // does not retrigger an infinite loop (React #185).
  const handleFilterPatch = useCallback((patch: Partial<PostFilterValue>) => {
    const s = useFilterStore.getState();
    if ('type' in patch) s.setType(patch.type ?? null);
    if ('categories' in patch) s.setCategories(patch.categories ?? []);
    if ('itemConditions' in patch) s.setItemConditions(patch.itemConditions ?? []);
    if ('locationFilter' in patch) s.setLocationFilter(patch.locationFilter ?? null);
    if ('statusFilter' in patch) s.setStatusFilter(patch.statusFilter ?? 'open');
    if ('sortOrder' in patch) s.setSortOrder(patch.sortOrder ?? 'newest');
    if ('proximitySortCity' in patch || 'proximitySortCityName' in patch) {
      s.setProximitySortCity(patch.proximitySortCity ?? null, patch.proximitySortCityName ?? null);
    }
    if ('followersOnly' in patch) s.setFollowersOnly(patch.followersOnly ?? false);
    if ('searchQuery' in patch) s.setSearchQuery(patch.searchQuery ?? '');
  }, []);

  const header = (
    <View>
      {surveyBanner.shouldShow && (
        <SurveyPromptBanner slug={surveyBanner.slug} onSnooze={surveyBanner.onSnooze} />
      )}
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
    <Screen blobs="content" testID="feed-screen">
      <TopBar
        extraIcon={<FeedFilterIcon activeCount={activeCount} onPress={() => setSheetOpen(true)} />}
      />

      <PostFeedList
        listRef={listRef}
        data={feedPosts}
        isLoading={feedQuery.isLoading}
        isRefetching={feedQuery.isRefetching}
        isError={feedQuery.isError}
        onRefresh={refetchAndReset}
        onRetry={() => feedQuery.refetch()}
        hasMore={feedQuery.hasNextPage}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
            void feedQuery.fetchNextPage();
          }
        }}
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
        value={sheetValue}
        onPatch={handleFilterPatch}
        onClear={() => filter.clearAll()}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}
