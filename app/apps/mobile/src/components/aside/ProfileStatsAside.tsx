// Own-profile aside — personal stats summary (FR-RESP-003).
// Reuses the FR-STATS-001 self queries (shared keys with the stats screen).
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography } from '@kc/ui';
import { useAuthStore } from '../../store/authStore';
import { getUserRepo } from '../../services/userComposition';
import { useProfileTabCounts } from '../../hooks/useProfileTabCounts';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../lib/rtlLayout';
import { AsideCard } from './AsideCard';

export function ProfileStatsAside() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.userId);

  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000, // PERF-3: profile (self) — shared key with the stats screen
  });
  const { openCount, closedCount } = useProfileTabCounts({
    profileUserId: userId,
    viewerUserId: userId ?? null,
  });

  const u = userQuery.data;
  const rows = [
    { key: 'karma', label: t('aside.profileKarma'), value: u?.karmaPoints },
    { key: 'given', label: t('stats.given'), value: u?.itemsGivenCount },
    { key: 'received', label: t('stats.received'), value: u?.itemsReceivedCount },
    { key: 'open', label: t('aside.profileOpenPosts'), value: openCount },
    { key: 'closed', label: t('aside.profileClosedPosts'), value: closedCount },
  ];

  return (
    <AsideCard title={t('aside.profileStatsTitle')}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row} testID={`aside-profile-${row.key}`}>
          <Text style={styles.value}>{row.value ?? '—'}</Text>
          <Text style={styles.label} numberOfLines={1}>
            {row.label}
          </Text>
        </View>
      ))}
      <TouchableOpacity
        accessibilityRole="button"
        testID="aside-profile-all-stats"
        onPress={() => router.push('/stats' as never)}
      >
        <Text style={styles.allLink}>{t('aside.profileAllStats')}</Text>
      </TouchableOpacity>
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
  allLink: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: rtlTextAlignStart,
  },
}));
