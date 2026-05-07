// Home Feed — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-FEED-001, 002, 003 (basic), 004, 005, 013.
import React, { useState } from 'react';
import {
  Image, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { colors, radius, spacing, typography } from '@kc/ui';
import { PostFeedList } from '../../src/components/PostFeedList';
import { useFilterStore } from '../../src/store/filterStore';
import { useAuthStore } from '../../src/store/authStore';
import { getFeedUseCase } from '../../src/services/postsComposition';

export default function HomeFeedScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const viewerId = session?.userId ?? null;

  // useShallow: object-returning selectors must use shallow equality so the
  // result reference is stable across renders (Zustand v5 + React 19 strict
  // useSyncExternalStore would otherwise loop on getSnapshot).
  const filter = useFilterStore(
    useShallow((s) => ({
      type: s.type ?? undefined,
      category: s.category ?? undefined,
      city: s.city ?? undefined,
      includeClosed: s.includeClosed,
      sortBy: s.sortBy,
    })),
  );
  const activeCount = useFilterStore((s) => s.activeCount());

  const [searchText, setSearchText] = useState('');

  const query = useQuery({
    queryKey: ['feed', viewerId, { ...filter, searchQuery: searchText.trim() || undefined }],
    queryFn: () =>
      getFeedUseCase().execute({
        viewerId,
        filter: { ...filter, searchQuery: searchText.trim() || undefined },
        limit: 20,
      }),
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/chat/')}>
          <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={styles.topBarLogo} resizeMode="contain" />
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="חפש לפי מוצר, קטגוריה..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => {}}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeCount > 0 ? colors.textInverse : colors.textPrimary}
          />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topBarLogo: { height: 36, width: 36 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, height: 40, gap: spacing.xs,
  },
  searchIcon: { marginLeft: spacing.xs },
  searchText: { flex: 1, ...typography.body, color: colors.textPrimary },
  filterBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 16, height: 16,
    borderRadius: 8, backgroundColor: colors.error,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { ...typography.caption, color: colors.textInverse, fontSize: 10 },
});
