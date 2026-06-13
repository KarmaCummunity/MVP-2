// Donations-hub aside — live community snapshot (FR-RESP-003).
// Reuses the FR-STATS-004 community_stats query + its he locale keys.
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography } from '@kc/ui';
import { getCommunityStatsSnapshotUseCase } from '../../services/postsComposition';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../lib/rtlLayout';
import { AsideCard } from './AsideCard';

export function CommunityStatsAside() {
  const styles = useStyles();
  const { t } = useTranslation();

  const communityQuery = useQuery({
    queryKey: ['community-stats'],
    queryFn: () => getCommunityStatsSnapshotUseCase().execute(),
    staleTime: 5 * 60_000, // PERF-3: shared key with the stats screen — one fetch serves both
  });

  const snapshot = communityQuery.data;
  const rows = [
    { key: 'users', label: t('stats.communityUsers'), value: snapshot?.registeredUsers },
    { key: 'posts', label: t('stats.communityPosts'), value: snapshot?.activePublicPosts },
    { key: 'delivered', label: t('stats.communityDelivered'), value: snapshot?.itemsDeliveredTotal },
  ];

  return (
    <AsideCard title={t('stats.communityTitle')}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row} testID={`aside-community-${row.key}`}>
          <Text style={styles.value}>{row.value ?? '—'}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {row.label}
          </Text>
        </View>
      ))}
    </AsideCard>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  row: {
    flexDirection: rowDirectionStart,
    alignItems: 'baseline' as const,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  value: {
    ...typography.h4,
    color: colors.primary,
    minWidth: 36,
    textAlign: rtlTextAlignStart,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    textAlign: rtlTextAlignStart,
  },
}));
