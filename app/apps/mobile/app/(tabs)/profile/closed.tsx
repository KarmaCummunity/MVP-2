// My Profile — closed-posts tab. Sibling route: ./index.tsx.
// Mapped to: FR-PROFILE-001 AC4 (closed lane), FR-CLOSURE-005 AC4, FR-CLOSURE-008.
import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MyProfileChrome } from '../../../src/components/profile/MyProfileChrome';
import { ProfileClosedPostsGrid } from '../../../src/components/profile/ProfileClosedPostsGrid';
import { Screen } from '../../../src/components/ui/Screen';
import { useAuthStore } from '../../../src/store/authStore';
import { useProfileClosedPosts } from '../../../src/hooks/useProfileClosedPosts';
import {
  useShellTabBarVisibility,
  shellTabBarHeightPx,
} from '../../../src/navigation/useShellTabBarVisibility';

export default function MyProfileClosedScreen() {
  const userId = useAuthStore((s) => s.session?.userId);
  const insets = useSafeAreaInsets();
  const tabBarPad = shellTabBarHeightPx(useShellTabBarVisibility()) + insets.bottom;
  const closed = useProfileClosedPosts({ profileUserId: userId, viewerUserId: userId ?? null });

  return (
    <Screen blobs="content">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarPad }}
      >
        <MyProfileChrome activeTab="closed" />
        <ProfileClosedPostsGrid
          items={closed.items}
          isLoading={closed.isLoading}
          empty="self_closed"
          hasMore={closed.hasMore}
          isLoadingMore={closed.isLoadingMore}
          onLoadMore={closed.loadMore}
          profileUserId={userId!}
        />
      </ScrollView>
    </Screen>
  );
}
