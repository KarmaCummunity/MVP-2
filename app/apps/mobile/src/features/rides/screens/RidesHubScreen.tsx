// FR-RIDE-002 + FR-RIDE-023 — rides hub.
// V3.0 (D-55 supersedes D-51) — restores the in-app rides UI: live feed of
// open ride listings + filter sheet + create FAB + realtime "↑ N new" banner.
// NGO transport links move into a header-triggered sheet (RideTransportLinksSheet).
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { spacing, useTheme } from '@kc/ui';

import { TopBar } from '../../../components/TopBar';
import { Screen } from '../../../components/ui/Screen';
import { IconTile } from '../../../components/ui/IconTile';
import { useShellTabBarScrollInset } from '../../../navigation/useShellTabBarVisibility';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

import { useRidesFeed } from '../hooks/useRidesFeed';
import { useRidesRealtimeBanner } from '../hooks/useRidesRealtimeBanner';
import { useRidesFilterStore } from '../store/ridesFilterStore';
import { RideCard } from '../components/RideCard';
import { RideCreateSheet } from '../sheets/RideCreateSheet';
import { RideFilterSheet } from '../sheets/RideFilterSheet';
import { RideTransportLinksSheet } from '../sheets/RideTransportLinksSheet';
import { useRidesHubStyles } from './ridesHubScreen.styles';

const SEARCH_DEBOUNCE_MS = 300;

export function RidesHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useRidesHubStyles();
  const tabBarPad = useShellTabBarScrollInset();

  const setSearchQuery = useRidesFilterStore((s) => s.setSearchQuery);
  const activeFilterCount = useRidesFilterStore((s) => s.activeFilterCount());

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  // FR-RIDE-002 AC3 — debounced search mirrors into the filter store, which is
  // the source of truth read by `useRidesFeed`.
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  const feed = useRidesFeed();
  const banner = useRidesRealtimeBanner(true);

  const onRefresh = useCallback(async () => {
    banner.acknowledge();
    await feed.refetch();
  }, [banner, feed]);

  const onBannerTap = useCallback(async () => {
    banner.acknowledge();
    await feed.refetch();
  }, [banner, feed]);

  const headerExtra = (
    <View style={styles.headerExtraRow}>
      <Pressable
        onPress={() =>
          router.push('/(tabs)/donations/rides/my-requests' as Parameters<typeof router.push>[0])
        }
        accessibilityRole="button"
        accessibilityLabel={t('donations.rides.requests.title')}
        style={styles.headerIconBtn}
      >
        <Ionicons name="navigate-outline" size={22} color={colors.textPrimary} />
      </Pressable>
      <Pressable
        onPress={() =>
          router.push('/(tabs)/donations/rides/my-rides' as Parameters<typeof router.push>[0])
        }
        accessibilityRole="button"
        accessibilityLabel={t('donations.rides.dashboard.title')}
        style={styles.headerIconBtn}
      >
        <Ionicons name="car-outline" size={22} color={colors.textPrimary} />
      </Pressable>
      <Pressable
        onPress={() => setLinksOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('donations.rides.linksIconA11y')}
        style={styles.headerIconBtn}
      >
        <Ionicons name="link-outline" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );

  const renderEmpty = () => {
    if (feed.isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <IconTile icon="car-outline" size="lg" />
        <Text style={styles.emptyTitle}>{t('donations.rides.empty')}</Text>
        <Text style={styles.emptyDesc}>
          {activeFilterCount > 0
            ? t('donations.rides.emptyFiltered')
            : t('donations.rides.emptyDesc')}
        </Text>
        <Pressable
          style={styles.emptyCta}
          onPress={() => setCreateOpen(true)}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={colors.textInverse} />
          <Text style={styles.emptyCtaText}>{t('donations.rides.emptyCta')}</Text>
        </Pressable>
        <Pressable
          style={styles.emptyLinksRow}
          onPress={() => setLinksOpen(true)}
          accessibilityRole="button"
        >
          <Ionicons name="link-outline" size={16} color={colors.primary} />
          <Text style={styles.emptyLinksText}>{t('donations.rides.openTransportLinks')}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Screen blobs="content">
      <TopBar extraIcon={headerExtra} />

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t('donations.rides.searchPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            returnKeyType="search"
            textAlign="right"
            accessibilityLabel={t('donations.rides.searchPlaceholder')}
          />
          {searchInput.length > 0 ? (
            <Pressable
              onPress={() => setSearchInput('')}
              accessibilityRole="button"
              accessibilityLabel={t('general.close')}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('donations.rides.filtersTitle')}
          style={styles.filterBtn}
        >
          <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{String(activeFilterCount)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {banner.newCount > 0 ? (
        <View style={styles.bannerWrap}>
          <Pressable
            style={styles.banner}
            onPress={() => void onBannerTap()}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-up" size={16} color={colors.textInverse} />
            <Text style={styles.bannerText}>
              {banner.newCount === 1
                ? t('donations.rides.newRidesOne')
                : t('donations.rides.newRidesMany', { count: banner.newCount })}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={feed.rides}
        keyExtractor={(r) => r.rideId}
        renderItem={({ item }) => <RideCard ride={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarPad + 96 },
          feed.rides.length === 0 && styles.listContentEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => setCreateOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('donations.rides.fabA11y')}
        style={[styles.fab, { bottom: tabBarPad + spacing.lg }]}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <RideCreateSheet visible={createOpen} onClose={() => setCreateOpen(false)} />
      <RideFilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} />
      <RideTransportLinksSheet visible={linksOpen} onClose={() => setLinksOpen(false)} />
    </Screen>
  );
}
