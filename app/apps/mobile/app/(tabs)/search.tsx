// ─────────────────────────────────────────────
// Search tab — Universal Smart Search & Discovery
// Mapped to SRS: FR-FEED-017+ (replaces FR-FEED-016 placeholder)
//
// Two modes:
//   1. Explore (no query) — shows a discovery feed of recent posts, active
//      users, and popular donation links. Content loads on mount so the screen
//      is never empty.
//   2. Search (query >= 2 chars) — filters across all three domains with
//      ILIKE substring matching and smart category-aware link discovery.
//
// Key UX decisions:
//   • 300ms debounce to avoid hammering the DB on every keystroke.
//   • 5 results per section initially; "Show all" expands to 50.
//   • Recent searches persisted to AsyncStorage (max 10).
//   • City filter applies to posts + users only; links are national.
//   • All text from i18n; all colors from the global theme; RTL layout.
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { colors } from '@kc/ui';
import type { SearchResultType, SearchSortBy } from '@kc/domain';
import { search as t } from '../../src/i18n/locales/he/donations';

import { useAuthStore } from '../../src/store/authStore';
import { useSearchStore } from '../../src/store/searchStore';
import { getUniversalSearchUseCase } from '../../src/services/searchComposition';
import {
  UserResultCard,
  PostResultCard,
  LinkResultCard,
} from '../../src/components/SearchResultCard';
import { SearchFilterSheet } from '../../src/components/SearchFilterSheet';
import { TopBar } from '../../src/components/TopBar';
import { Screen } from '../../src/components/ui/Screen';
import { MotionEntry, ENTRY_DELAY } from '../../src/components/ui/MotionEntry';
import { searchStyles as styles } from './search.styles';

// ── Constants ─────────────────────────────────
/** Debounce delay for search input to avoid excessive queries. */
const DEBOUNCE_MS = 300;
/** Number of results shown per section before "Show all" is tapped. */
const PREVIEW_LIMIT = 5;
/** Maximum results per section after "Show all" is tapped. */
const FULL_LIMIT = 50;

export default function SearchScreen() {
  const session = useAuthStore((s) => s.session);
  const viewerId = session?.userId ?? null;

  // ── Search input with debounce ──────────────
  const [inputText, setInputText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text.trim()), DEBOUNCE_MS);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Store (filters, recent searches) ────────
  const store = useSearchStore();
  const filters = useSearchStore(
    useShallow((s) => ({
      resultType: s.resultType,
      postType: s.postType,
      category: s.category,
      donationCategory: s.donationCategory,
      city: s.city,
      sortBy: s.sortBy,
      minFollowers: s.minFollowers,
    })),
  );
  const filterCount = useSearchStore((s) => s.activeFilterCount());

  // ── Expanded section state ──────────────────
  // When a user taps "Show all" on a section, we expand it to FULL_LIMIT.
  const [expandedSection, setExpandedSection] = useState<SearchResultType | null>(null);

  // ── Filter sheet visibility ─────────────────
  const [filterVisible, setFilterVisible] = useState(false);

  // ── Derived state ───────────────────────────
  const isSearchMode = debouncedQuery.length >= 2;
  const isSingleCharTyped = inputText.length > 0 && inputText.trim().length < 2;

  // ── Data query ──────────────────────────────
  // Fires on mount (explore mode) AND on every debounced query change.
  const query = useQuery({
    queryKey: ['universalSearch', debouncedQuery, filters, expandedSection],
    queryFn: () =>
      getUniversalSearchUseCase().execute({
        query: debouncedQuery,
        filters,
        viewerId,
        limits: {
          posts: expandedSection === 'post' ? FULL_LIMIT : PREVIEW_LIMIT,
          users: expandedSection === 'user' ? FULL_LIMIT : PREVIEW_LIMIT,
          links: expandedSection === 'link' ? FULL_LIMIT : PREVIEW_LIMIT,
        },
      }),
    // Always enabled — empty query triggers explore mode
    enabled: !isSingleCharTyped,
  });

  const results = query.data;
  const hasResults =
    results && (results.posts.length > 0 || results.users.length > 0 || results.links.length > 0);

  // ── Handlers ────────────────────────────────

  /** Tapping a recent search fills the input and fires the search. */
  const handleRecentTap = (q: string) => {
    setInputText(q);
    setDebouncedQuery(q);
  };

  /** Submitting search saves to recent searches. */
  const handleSubmit = () => {
    const q = inputText.trim();
    if (q.length >= 2) {
      store.addRecentSearch(q);
      setDebouncedQuery(q);
    }
  };

  /** Clears the search input and resets to explore mode. */
  const handleClear = () => {
    setInputText('');
    setDebouncedQuery('');
    setExpandedSection(null);
  };

  // ── Render ──────────────────────────────────

  return (
    <Screen blobs="content">
      {/* ── Header ──────────────────────────── */}
      <TopBar />

      {/* ── Search bar + filter button ──────── */}
      <MotionEntry variant="hero" delay={ENTRY_DELAY.hero} style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            value={inputText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmit}
            placeholder={t.placeholder}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            returnKeyType="search"
            autoCorrect={false}
          />
          {inputText ? (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter button with active count badge */}
        <TouchableOpacity
          style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={filterCount > 0 ? colors.textInverse : colors.textPrimary}
          />
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </MotionEntry>

      {/* ── Category type chips ─────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipContainer}
      >
        {([null, 'post', 'user', 'link'] as (SearchResultType | null)[]).map((type) => {
          const labels: Record<string, string> = {
            '': t.all,
            post: t.posts,
            user: t.people,
            link: t.links,
          };
          const active = filters.resultType === type;
          return (
            <Pressable
              key={type ?? 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                store.setResultType(type);
                setExpandedSection(null);
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {labels[type ?? '']}
              </Text>
            </Pressable>
          );
        })}

        {/* Sort chips — only visible when actively searching */}
        {isSearchMode && (
          <>
            <View style={styles.chipDivider} />
            {(['relevance', 'newest', 'followers'] as SearchSortBy[]).map((s) => {
              const labels: Record<string, string> = {
                relevance: t.sortRelevance,
                newest: t.sortNewest,
                followers: t.sortFollowers,
              };
              const active = filters.sortBy === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                  onPress={() => store.setSortBy(s)}
                >
                  <Ionicons
                    name="swap-vertical-outline"
                    size={12}
                    color={active ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                    {labels[s]}
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Content area ────────────────────── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {/* Min chars message (1 char typed) */}
        {isSingleCharTyped && (
          <View style={styles.emptyState}>
            <Ionicons name="text-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptySubtitle}>{t.minChars}</Text>
          </View>
        )}

        {/* Loading spinner */}
        {!isSingleCharTyped && query.isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        )}

        {/* No results (search mode only — explore always has content) */}
        {isSearchMode && !query.isLoading && results && !hasResults && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>{t.noResults}</Text>
            <Text style={styles.emptySubtitle}>{t.noResultsDesc}</Text>
          </View>
        )}

        {/* Recent searches (shown in explore mode, above the discovery feed) */}
        {!isSearchMode && !isSingleCharTyped && store.recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => store.clearRecentSearches()}>
                <Text style={styles.clearRecentText}>{t.clearRecent}</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>{t.recentSearches}</Text>
            </View>
            {store.recentSearches.map((q, i) => (
              <Pressable
                key={`${q}-${i}`}
                style={({ pressed }) => [styles.recentRow, pressed && styles.recentRowPressed]}
                onPress={() => handleRecentTap(q)}
              >
                <Ionicons name="chevron-back" size={16} color={colors.textDisabled} />
                <Text style={styles.recentText}>{q}</Text>
                <Ionicons name="time-outline" size={16} color={colors.textDisabled} />
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Result sections ──────────────── */}
        {!isSingleCharTyped && results && hasResults && (
          <>
            {/* Users section */}
            {results.users.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {results.users.length >= PREVIEW_LIMIT && expandedSection !== 'user' && (
                    <TouchableOpacity onPress={() => setExpandedSection('user')}>
                      <Text style={styles.showAllText}>{t.showAll}</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionCount}>({results.users.length})</Text>
                    <Ionicons name="people" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>{t.sectionPeople}</Text>
                  </View>
                </View>
                {results.users.map((user) => (
                  <UserResultCard key={user.userId} user={user} />
                ))}
              </View>
            )}

            {/* Posts section */}
            {results.posts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {results.posts.length >= PREVIEW_LIMIT && expandedSection !== 'post' && (
                    <TouchableOpacity onPress={() => setExpandedSection('post')}>
                      <Text style={styles.showAllText}>{t.showAll}</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionCount}>({results.posts.length})</Text>
                    <Ionicons name="cube" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>{t.sectionPosts}</Text>
                  </View>
                </View>
                {results.posts.map((post) => (
                  <PostResultCard key={post.postId} post={post} />
                ))}
              </View>
            )}

            {/* Links section */}
            {results.links.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {results.links.length >= PREVIEW_LIMIT && expandedSection !== 'link' && (
                    <TouchableOpacity onPress={() => setExpandedSection('link')}>
                      <Text style={styles.showAllText}>{t.showAll}</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionCount}>({results.links.length})</Text>
                    <Ionicons name="link" size={18} color={colors.secondary} />
                    <Text style={styles.sectionTitle}>{t.sectionLinks}</Text>
                  </View>
                </View>
                {/* Note: city filter doesn't apply to links — they're national */}
                {filters.city && (
                  <View style={styles.nationalNote}>
                    <Ionicons name="globe-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.nationalNoteText}>{t.nationalLinks}</Text>
                  </View>
                )}
                {results.links.map((link) => (
                  <LinkResultCard key={link.id} link={link} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Filter sheet (modal) ───────────── */}
      <SearchFilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </Screen>
  );
}
