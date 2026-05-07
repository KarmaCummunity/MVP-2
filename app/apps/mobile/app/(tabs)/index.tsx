// Home Feed screen
// Mapped to: SRS §3.3.1, §3.3.2
import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { PostCardGrid } from '../../src/components/PostCardGrid';
import { EmptyState } from '../../src/components/EmptyState';
import { MOCK_POSTS } from '../../src/mock/data';
import { useFilterStore } from '../../src/store/filterStore';

export default function HomeFeedScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const activeCount = useFilterStore((s) => s.activeCount());

  const filteredPosts = MOCK_POSTS.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/chat/')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Image
          source={require('../../assets/logo.png')}
          style={styles.topBarLogo}
          resizeMode="contain"
        />

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
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

      {/* Feed — 2 columns */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(p) => p.postId}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <PostCardGrid post={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji="🔍"
            title="לא נמצאו פוסטים"
            subtitle="נסה לשנות את הסינון או חפש בכל הערים."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarLeft: { width: 44, alignItems: 'flex-start' },
  topBarRight: { width: 44, alignItems: 'flex-end' },
  topBarLogo: {
    height: 36,
    width: 36,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  searchIcon: { marginLeft: spacing.xs },
  searchText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontSize: 10,
  },
  row: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingTop: spacing.base,
    paddingBottom: spacing['3xl'],
  },
});
