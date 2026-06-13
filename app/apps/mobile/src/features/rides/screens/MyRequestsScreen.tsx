// FR-RIDE-025 — passenger requests screen (rider side counterpart to FR-RIDE-024).
// Shares the grouped-list scaffolding with MyRidesScreen via RideListScreen.
import React from 'react';
import type { RideParticipant } from '@kc/domain';

import { useMyRideRequests } from '../hooks/useMyRideRequests';
import { MyRequestRow } from '../components/MyRequestRow';
import { RideListScreen, type RideListSection } from './RideListScreen';

export function MyRequestsScreen() {
  const my = useMyRideRequests();

  const sections: RideListSection<RideParticipant>[] = [];
  if (my.buckets.pending.length > 0) {
    sections.push({
      kind: 'header',
      key: 'h-pending',
      titleKey: 'donations.rides.requests.pending',
      count: my.buckets.pending.length,
    });
    for (const r of my.buckets.pending) {
      sections.push({ kind: 'row', key: r.participantId, item: r });
    }
  }
  if (my.buckets.approved.length > 0) {
    sections.push({
      kind: 'header',
      key: 'h-approved',
      titleKey: 'donations.rides.requests.approved',
      count: my.buckets.approved.length,
    });
    for (const r of my.buckets.approved) {
      sections.push({ kind: 'row', key: r.participantId, item: r });
    }
  }
  if (my.buckets.history.length > 0) {
    sections.push({
      kind: 'header',
      key: 'h-history',
      titleKey: 'donations.rides.requests.history',
      count: my.buckets.history.length,
    });
    for (const r of my.buckets.history) {
      sections.push({ kind: 'row', key: r.participantId, item: r });
    }
  }

  return (
    <RideListScreen
      titleKey="donations.rides.requests.title"
      sections={sections}
      renderRow={(request) => <MyRequestRow request={request} />}
      empty={{
        icon: 'navigate-outline',
        titleKey: 'donations.rides.requests.empty',
        descKey: 'donations.rides.requests.emptyDesc',
        ctaIcon: 'car-outline',
        ctaKey: 'donations.rides.requests.emptyCta',
      }}
      isLoading={my.isLoading}
      isRefetching={my.isRefetching}
      onRefresh={() => void my.refetch()}
    />
  );
}
