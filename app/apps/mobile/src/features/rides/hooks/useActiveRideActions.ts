// FR-RIDE-031 + FR-RIDE-034 + FR-RIDE-035 — action handlers + busy state for ActiveRideScreen.
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  getArriveRideUseCase,
  getStartRideUseCase,
  getTriggerRideEmergencyUseCase,
} from '../composition/ridesComposition';

export interface UseActiveRideActionsResult {
  readonly busy: string | null;
  readonly start: (rideId: string) => Promise<void>;
  readonly arrive: (rideId: string, reason: 'arrived' | 'breakdown') => void;
  readonly emergency: (rideId: string) => void;
}

export function useActiveRideActions(refetch: () => Promise<void>): UseActiveRideActionsResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const start = async (rideId: string): Promise<void> => {
    setBusy('start');
    try {
      await getStartRideUseCase().execute(rideId);
      await queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] });
      await refetch();
    } catch (err) {
      Alert.alert(t('donations.rides.active.errorStart'), (err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const arrive = (rideId: string, reason: 'arrived' | 'breakdown'): void => {
    const confirmCopy =
      reason === 'breakdown'
        ? t('donations.rides.active.confirmBreakdown')
        : t('donations.rides.active.confirmArrive');
    Alert.alert(t('donations.rides.active.confirmTitle'), confirmCopy, [
      { text: t('general.back'), style: 'cancel' },
      {
        text: t('donations.rides.active.confirmYes'),
        style: reason === 'breakdown' ? 'destructive' : 'default',
        onPress: async () => {
          setBusy(reason);
          try {
            await getArriveRideUseCase().execute({ rideId, reason });
            await queryClient.invalidateQueries({ queryKey: ['rides', 'detail', rideId] });
            await refetch();
          } catch (err) {
            Alert.alert(t('donations.rides.active.errorArrive'), (err as Error).message);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const emergency = (rideId: string): void => {
    Alert.alert(
      t('donations.rides.active.emergencyConfirmTitle'),
      t('donations.rides.active.emergencyConfirmMessage'),
      [
        { text: t('general.back'), style: 'cancel' },
        {
          text: t('donations.rides.active.emergencyConfirmYes'),
          style: 'destructive',
          onPress: async () => {
            setBusy('emergency');
            try {
              // V3.0.7 ships without inline geolocation permission; lat/lng
              // are deferred to FR-RIDE-036 (consent-gated capture, P3).
              await getTriggerRideEmergencyUseCase().execute({
                rideId,
                lat: null,
                lng: null,
                note: null,
              });
              await refetch();
            } catch (err) {
              Alert.alert(t('donations.rides.active.errorEmergency'), (err as Error).message);
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return { busy, start, arrive, emergency };
}
