// My Profile — saved posts list. Stack header from `profile/_layout.tsx`.
// Mapped to: FR-PROFILE-016, FR-POST-022.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@kc/ui';
import { ProfilePostsGrid } from '../../../src/components/profile/ProfilePostsGrid';
import { useAuthStore } from '../../../src/store/authStore';
import { getListSavedPostsUseCase } from '../../../src/services/savedPostsComposition';

export default function MyProfileSavedScreen() {
  const userId = useAuthStore((s) => s.session?.userId);

  const savedPostsQuery = useQuery({
    queryKey: ['saved-posts', userId],
    queryFn: () => getListSavedPostsUseCase().execute({ limit: 30 }),
    enabled: Boolean(userId),
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfilePostsGrid
          posts={savedPostsQuery.data?.posts ?? []}
          isLoading={savedPostsQuery.isLoading}
          empty="self_saved"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
