// Home Feed — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-FEED-001, 002, 003 (basic), 004, 005, 013.
// Search and filtering moved to the dedicated Search tab (FR-FEED-017+).
import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '@kc/ui';
import { PostFeedList } from '../../src/components/PostFeedList';
import { TopBar } from '../../src/components/TopBar';
import { useAuthStore } from '../../src/store/authStore';
import { getFeedUseCase } from '../../src/services/postsComposition';

export default function HomeFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ published?: string }>();
  const session = useAuthStore((s) => s.session);
  const viewerId = session?.userId ?? null;

  // Brief success banner after publish (web — Alert.alert is unreliable in RN-Web).
  const [publishedToast, setPublishedToast] = useState(false);
  useEffect(() => {
    if (params.published !== '1') return;
    setPublishedToast(true);
    const t = setTimeout(() => setPublishedToast(false), 2200);
    // Clear the query param so a refresh doesn't re-fire the toast.
    router.setParams({ published: undefined });
    return () => clearTimeout(t);
  }, [params.published, router]);

  const query = useQuery({
    queryKey: ['feed', viewerId],
    queryFn: () =>
      getFeedUseCase().execute({
        viewerId,
        filter: {},
        limit: 20,
      }),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />

      {publishedToast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
          <Text style={styles.toastText}>הפוסט שלך פורסם!</Text>
        </View>
      )}

      <PostFeedList
        data={query.data?.posts}
        isLoading={query.isLoading}
        isRefetching={query.isRefetching}
        isError={query.isError}
        onRefresh={() => query.refetch()}
        onRetry={() => query.refetch()}
        hasMore={Boolean(query.data?.nextCursor)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  toastText: { ...typography.body, color: colors.textInverse, fontWeight: '600' as const },
});
