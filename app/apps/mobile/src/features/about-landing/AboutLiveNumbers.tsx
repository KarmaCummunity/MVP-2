// Live community stats wrapper for the About → Numbers section.
// Wires `useCommunityStatsAbout` (FR-STATS-004) into the existing CommunityStatsPanel UI.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CommunityStatsPanel } from '../../components/stats/CommunityStatsPanel';
import { useCommunityStatsAbout } from '../../hooks/useCommunityStatsAbout';

export function AboutLiveNumbers() {
  const { t } = useTranslation();
  const { users, posts, delivered, loading, error, refetch } = useCommunityStatsAbout();

  return (
    <CommunityStatsPanel
      users={users}
      posts={posts}
      delivered={delivered}
      loading={loading}
      error={error}
      onRetry={refetch}
      labels={{
        title: t('stats.communityTitle'),
        users: t('stats.communityUsers'),
        posts: t('stats.communityPosts'),
        delivered: t('stats.communityDelivered'),
        hint: t('stats.communityHint'),
        retry: t('general.retry'),
      }}
    />
  );
}
