// FR-RIDE-024 — driver dashboard.
// Lists the viewer's rides, grouped Upcoming / Past, with inline approve/reject
// of pending join requests + close/cancel actions per row.
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, radius, spacing, typography, useTheme } from '@kc/ui';
import type { RideListingRow } from '@kc/application';

import { TopBar } from '../../../components/TopBar';
import { Screen } from '../../../components/ui/Screen';
import { IconTile } from '../../../components/ui/IconTile';
import { useShellTabBarScrollInset } from '../../../navigation/useShellTabBarVisibility';
import { rtlTextAlignStart } from '../../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../../lib/rtlLayout';

import { useMyRides } from '../hooks/useMyRides';
import { MyRideRow } from '../components/MyRideRow';

type Section = { kind: 'header'; key: string; titleKey: string; count: number } | { kind: 'row'; key: string; ride: RideListingRow; active: boolean };

export function MyRidesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const tabBarPad = useShellTabBarScrollInset();

  const my = useMyRides();

  const sections: Section[] = [];
  if (my.buckets.upcoming.length > 0) {
    sections.push({
      kind: 'header',
      key: 'h-upcoming',
      titleKey: 'donations.rides.dashboard.upcoming',
      count: my.buckets.upcoming.length,
    });
    for (const r of my.buckets.upcoming) {
      sections.push({ kind: 'row', key: r.rideId, ride: r, active: true });
    }
  }
  if (my.buckets.past.length > 0) {
    sections.push({
      kind: 'header',
      key: 'h-past',
      titleKey: 'donations.rides.dashboard.past',
      count: my.buckets.past.length,
    });
    for (const r of my.buckets.past) {
      sections.push({ kind: 'row', key: r.rideId, ride: r, active: false });
    }
  }

  const renderEmpty = () => {
    if (my.isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <IconTile icon="car-outline" size="lg" />
        <Text style={styles.emptyTitle}>{t('donations.rides.dashboard.empty')}</Text>
        <Text style={styles.emptyDesc}>{t('donations.rides.dashboard.emptyDesc')}</Text>
        <Pressable
          style={styles.cta}
          onPress={() =>
            router.push('/(tabs)/donations/rides' as Parameters<typeof router.push>[0])
          }
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={colors.textInverse} />
          <Text style={styles.ctaText}>{t('donations.rides.emptyCta')}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Screen blobs="content">
      <TopBar />
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('general.back')}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('donations.rides.dashboard.title')}</Text>
        <View style={styles.titleSpacer} />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{t(item.titleKey)}</Text>
                <View style={styles.sectionHeaderBadge}>
                  <Text style={styles.sectionHeaderBadgeText}>{item.count}</Text>
                </View>
              </View>
            );
          }
          return <MyRideRow ride={item.ride} activeRow={item.active} />;
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarPad + 32 },
          sections.length === 0 && styles.listContentEmpty,
        ]}
        ItemSeparatorComponent={({ leadingItem }: { leadingItem?: Section }) => {
          // Headers don't get separators; rows do.
          if (leadingItem?.kind === 'header') return null;
          return <View style={styles.separator} />;
        }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={my.isRefetching}
            onRefresh={() => void my.refetch()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  titleRow: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: rtlTextAlignStart,
  },
  titleSpacer: { width: 22 },

  listContent: {
    paddingHorizontal: spacing.base,
    gap: 0,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  separator: { height: spacing.sm },

  sectionHeader: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionHeaderText: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
  },
  sectionHeaderBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.xs,
    borderRadius: 11,
    backgroundColor: colors.primarySurface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionHeaderBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700' as const,
  },

  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  cta: {
    flexDirection: rowDirectionStart,
    alignItems: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  ctaText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '700' as const,
  },
}));
