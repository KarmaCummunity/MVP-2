// FR-RIDE-005 — sticky anchored-ride card in chat (mirrors AnchoredPostCard).
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { makeUseStyles, radius, shadow, spacing, typography, useTheme } from '@kc/ui';
import { useAuthStore } from '../../store/authStore';
import { getRideListingUseCase } from '../../features/rides/composition/ridesComposition';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { rowDirectionStart } from '../../lib/rtlLayout';

interface Props {
  readonly anchorRideId: string | null;
}

export function AnchoredRideCard({ anchorRideId }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.session?.userId)!;

  const query = useQuery({
    queryKey: ['ride', anchorRideId, viewerId],
    queryFn: () => getRideListingUseCase().execute({ rideId: anchorRideId!, viewerId }),
    enabled: Boolean(anchorRideId),
  });

  const ride = query.data;
  if (!anchorRideId || !ride || ride.status !== 'open') return null;

  const isOffer = ride.mode === 'offer';
  const departsLabel = format(new Date(ride.departsAt), 'dd/MM HH:mm', { locale: dateFnsHe });

  const openRide = () => {
    router.push(`/(tabs)/donations/rides/${ride.rideId}` as Parameters<typeof router.push>[0]);
  };

  return (
    <Pressable
      onPress={openRide}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={t('donations.rides.anchoredOpenA11y')}
    >
      <View style={styles.body}>
        <View style={[styles.badge, isOffer ? styles.badgeOffer : styles.badgeRequest]}>
          <Text style={[styles.badgeText, { color: isOffer ? colors.giveTag : colors.requestTag }]}>
            {isOffer ? t('donations.rides.badgeOffer') : t('donations.rides.badgeRequest')}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {ride.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {ride.originCityName} → {ride.destCityName} · {departsLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  card: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  body: { flex: 1, gap: 4, minWidth: 0 },
  badge: {
    alignSelf: 'flex-end' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeOffer: { backgroundColor: colors.giveTagBg },
  badgeRequest: { backgroundColor: colors.requestTagBg },
  badgeText: { ...typography.caption, fontWeight: '600' as const },
  title: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
  },
}));
