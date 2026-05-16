// My Profile — closed-posts tab. Sibling route: ./index.tsx.
// Mapped to: FR-PROFILE-001 AC4 (closed lane), FR-CLOSURE-005 AC4, FR-CLOSURE-008.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@kc/ui';
import { MyProfileChrome } from '../../../src/components/profile/MyProfileChrome';
import { ProfileClosedPostsGrid } from '../../../src/components/profile/ProfileClosedPostsGrid';
import { useAuthStore } from '../../../src/store/authStore';
import { useProfileClosedPosts } from '../../../src/hooks/useProfileClosedPosts';

export default function MyProfileClosedScreen() {
  const userId = useAuthStore((s) => s.session?.userId);
  const closed = useProfileClosedPosts({ profileUserId: userId, viewerUserId: userId ?? null });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MyProfileChrome activeTab="closed" />
        <ProfileClosedPostsGrid
          items={closed.items}
          isLoading={closed.isLoading}
          empty="self_closed"
          hasMore={closed.hasMore}
          isLoadingMore={closed.isLoadingMore}
          onLoadMore={closed.loadMore}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
