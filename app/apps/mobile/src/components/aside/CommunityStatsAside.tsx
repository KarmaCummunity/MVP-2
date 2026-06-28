// Donations-hub aside — live community snapshot (FR-RESP-003).
// Reuses the FR-STATS-004 community_stats query + its he locale keys.
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getCommunityStatsSnapshotUseCase } from '../../services/postsComposition';
import { AsideCard } from './AsideCard';
import { AsideStatList, type AsideStatRow } from './AsideStatList';

export function CommunityStatsAside() {
  const { t } = useTranslation();

  const communityQuery = useQuery({
    queryKey: ['community-stats'],
    queryFn: () => getCommunityStatsSnapshotUseCase().execute(),
    staleTime: 5 * 60_000, // PERF-3: shared key with the stats screen — one fetch serves both
  });

  const snapshot = communityQuery.data;
  const rows: AsideStatRow[] = [
    { key: 'users', label: t('stats.communityUsers'), value: snapshot?.registeredUsers },
    { key: 'posts', label: t('stats.communityPosts'), value: snapshot?.activePublicPosts },
    { key: 'delivered', label: t('stats.communityDelivered'), value: snapshot?.itemsDeliveredTotal },
  ];

  return (
    <AsideCard title={t('stats.communityTitle')}>
      <AsideStatList rows={rows} testIDPrefix="aside-community" />
    </AsideCard>
  );
}
