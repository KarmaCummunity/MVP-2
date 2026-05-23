// My Profile — open-posts tab. Sibling route: ./closed.tsx.
// Mapped to: FR-PROFILE-001 AC4 (open lane), FR-POST-016.
import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { MyProfileChrome } from '../../../src/components/profile/MyProfileChrome';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { Screen } from '../../../src/components/ui/Screen';
import { useAuthStore } from '../../../src/store/authStore';
import { getMyPostsUseCase } from '../../../src/services/postsComposition';
import {
  useShellTabBarVisibility,
  shellTabBarHeightPx,
} from '../../../src/navigation/useShellTabBarVisibility';

export default function MyProfileOpenScreen() {
  const userId = useAuthStore((s) => s.session?.userId);
  const insets = useSafeAreaInsets();
  const tabBarPad = shellTabBarHeightPx(useShellTabBarVisibility()) + insets.bottom;

  const myPostsQuery = useQuery({
    queryKey: ['my-posts', userId],
    queryFn: () =>
      getMyPostsUseCase().execute({
        userId: userId!,
        status: ['open'],
        limit: 30,
        excludeVisibility: 'OnlyMe',
      }),
    enabled: Boolean(userId),
  });

  return (
    <Screen blobs="content">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarPad }}
      >
        <MyProfileChrome activeTab="open" />
        <ProfilePostsGrid
          posts={myPostsQuery.data?.posts ?? []}
          isLoading={myPostsQuery.isLoading}
          empty="self_open"
        />
      </ScrollView>
    </Screen>
  );
}
