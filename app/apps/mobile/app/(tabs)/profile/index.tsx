// My Profile — open-posts tab. Sibling route: ./closed.tsx.
// Mapped to: FR-PROFILE-001 AC4 (open lane), FR-POST-016.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@kc/ui';
import { MyProfileChrome } from '../../../src/components/profile/MyProfileChrome';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { useAuthStore } from '../../../src/store/authStore';
import { getMyPostsUseCase } from '../../../src/services/postsComposition';

export default function MyProfileOpenScreen() {
  const userId = useAuthStore((s) => s.session?.userId);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MyProfileChrome activeTab="open" />
        <ProfilePostsGrid
          posts={myPostsQuery.data?.posts ?? []}
          isLoading={myPostsQuery.isLoading}
          empty="self_open"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
