// FR-RIDE-002 — rides hub: search, filters, feed, FAB, NGO links footer.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, radius, spacing, typography, useTheme } from '@kc/ui';
import { TopBar } from '../../../components/TopBar';
import { Screen } from '../../../components/ui/Screen';
import { MotionEntry, ENTRY_DELAY } from '../../../components/ui/MotionEntry';
import { DonationLinksList } from '../../../components/DonationLinksList';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../../store/authStore';
import { useShellTabBarScrollInset } from '../../../navigation/useShellTabBarVisibility';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';
import { useRidesFilterStore } from '../store/ridesFilterStore';
import { getSearchRideListingsUseCase } from '../composition/ridesComposition';
import { RideCard } from '../components/RideCard';
import { RideFilterSheet } from '../sheets/RideFilterSheet';
import { RideCreateSheet } from '../sheets/RideCreateSheet';

const DEBOUNCE_MS = 300;

const useHubStyles = makeUseStyles(({ colors, isDark }) => ({
  searchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.base,
    height: 52,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 6,
    elevation: isDark ? 0 : 2,
  },
  searchText: { flex: 1, ...typography.body, color: colors.textPrimary },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBadge: {
    position: 'absolute' as const,
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  filterBadgeText: { ...typography.caption, color: colors.textInverse, fontSize: 10 },
  list: { paddingHorizontal: spacing.base, gap: spacing.base, paddingTop: spacing.sm },
  linksHeading: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  fab: {
    position: 'absolute' as const,
    bottom: spacing.xl,
    left: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  center: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: spacing.xl },
}));

export function RidesHubScreen() {
  const { t } = useTranslation();
  const styles = useHubStyles();
  const { colors } = useTheme();
  const tabBarPad = useShellTabBarScrollInset();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);

  const [inputText, setInputText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);

  const filters = useRidesFilterStore(
    useShallow((s) => ({
      originCityId: s.originCityId,
      destCityId: s.destCityId,
      mode: s.mode,
      departFrom: s.departFrom,
      departTo: s.departTo,
    })),
  );
  const filterCount = useRidesFilterStore((s) => s.activeFilterCount());
  const clearFilters = useRidesFilterStore((s) => s.clearFilters);

  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text.trim()), DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isSingleCharTyped = inputText.length > 0 && inputText.trim().length < 2;
  const searchQuery = debouncedQuery.length >= 2 ? debouncedQuery : null;

  const query = useQuery({
    queryKey: ['rides', viewerId, searchQuery, filters],
    queryFn: () =>
      getSearchRideListingsUseCase().execute({
        viewerId: viewerId!,
        query: searchQuery,
        originCityId: filters.originCityId,
        destCityId: filters.destCityId,
        mode: filters.mode,
        departFrom: filters.departFrom,
        departTo: filters.departTo,
        limit: 30,
      }),
    enabled: Boolean(viewerId) && !isSingleCharTyped,
  });

  const rides = query.data ?? [];
  const hasActiveFilters = filterCount > 0 || Boolean(searchQuery);

  const handleClear = () => {
    setInputText('');
    setDebouncedQuery('');
  };

  const listHeader = (
    <>
      <MotionEntry variant="hero" delay={ENTRY_DELAY.hero}>
        <Text style={styles.heroTitle}>{t('donations.rides.hubTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('donations.rides.hubSubtitle')}</Text>
      </MotionEntry>
      <MotionEntry variant="hero" delay={ENTRY_DELAY.hero + 40} style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchText}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder={t('donations.rides.searchPlaceholder')}
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
        <TouchableOpacity
          style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={filterCount > 0 ? colors.textInverse : colors.textPrimary}
          />
          {filterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </MotionEntry>
    </>
  );

  const listFooter = (
    <>
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
      {!query.isLoading && rides.length === 0 ? (
        <EmptyState
          icon="car-outline"
          title={t('donations.rides.empty')}
          subtitle={hasActiveFilters ? t('donations.rides.emptyFiltered') : t('donations.rides.emptyDesc')}
          action={
            hasActiveFilters ? (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {t('donations.rides.clearFilters')}
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      ) : null}
      <Text style={styles.linksHeading}>{t('donations.rides.linksSection')}</Text>
      <DonationLinksList categorySlug="transport" />
    </>
  );

  return (
    <Screen blobs="content">
      <TopBar />
      <FlatList
        data={rides}
        keyExtractor={(item) => item.rideId}
        renderItem={({ item }) => <RideCard ride={item} />}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarPad + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={styles.fab}
        onPress={() => setCreateVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('donations.rides.fabA11y')}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <RideFilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
      <RideCreateSheet visible={createVisible} onClose={() => setCreateVisible(false)} />
    </Screen>
  );
}
