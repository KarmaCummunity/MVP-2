// My Profile — "פוסטים סגורים" tab (closed posts). Sibling route: ./index.tsx.
// Mapped to: FR-PROFILE-001 AC4 (closed lane), FR-CLOSURE-005 AC4, FR-CLOSURE-008.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@kc/ui';
import { MyProfileChrome } from '../../../src/components/profile/MyProfileChrome';
import { ProfileClosedPostsGrid } from '../../../src/components/profile/ProfileClosedPostsGrid';
import { useAuthStore } from '../../../src/store/authStore';
import { getProfileClosedPostsUseCase } from '../../../src/services/postsComposition';

export default function MyProfileClosedScreen() {
  const userId = useAuthStore((s) => s.session?.userId);

  const closedPostsQuery = useQuery({
    queryKey: ['my-closed-posts', userId],
    queryFn: () =>
      getProfileClosedPostsUseCase().execute({
        profileUserId: userId!,
        viewerUserId: userId!,
        limit: 30,
      }),
    enabled: Boolean(userId),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MyProfileChrome activeTab="closed" />
        <ProfileClosedPostsGrid
          items={closedPostsQuery.data?.items ?? []}
          isLoading={closedPostsQuery.isLoading}
          empty="self_closed"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
