// FR-RIDE-024 — driver dashboard.
// Lists the viewer's rides, grouped Upcoming / Past, with inline approve/reject of
// pending join requests + close/cancel actions per row (see MyRideRow). The list
// scaffolding is shared with MyRequestsScreen via RideListScreen.
import React from 'react';
import type { RideListingRow } from '@kc/application';

import { useMyRides } from '../hooks/useMyRides';
import { MyRideRow } from '../components/MyRideRow';
import { RideListScreen, type RideListSection } from './RideListScreen';

type RideItem = { ride: RideListingRow; active: boolean };

export function MyRidesScreen() {
  const my = useMyRides();

  const sections: RideListSection<RideItem>[] = [];
  if (my.buckets.upcoming.length > 0) {
    sections.push({
      kind: 'header',
      key: 'h-upcoming',
      titleKey: 'donations.rides.dashboard.upcoming',
      count: my.buckets.upcoming.length,
    });
    for (const r of my.buckets.upcoming) {
      sections.push({ kind: 'row', key: r.rideId, item: { ride: r, active: true } });
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
      sections.push({ kind: 'row', key: r.rideId, item: { ride: r, active: false } });
    }
  }

  return (
    <RideListScreen
      titleKey="donations.rides.dashboard.title"
      sections={sections}
      renderRow={({ ride, active }) => <MyRideRow ride={ride} activeRow={active} />}
      empty={{
        icon: 'car-outline',
        titleKey: 'donations.rides.dashboard.empty',
        descKey: 'donations.rides.dashboard.emptyDesc',
        ctaIcon: 'add',
        ctaKey: 'donations.rides.emptyCta',
      }}
      isLoading={my.isLoading}
      isRefetching={my.isRefetching}
      onRefresh={() => void my.refetch()}
    />
  );
}
