// FR-RIDE-003 — publish ride bottom sheet (FAB entry).
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, addHours, addMinutes, format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { RideError } from '@kc/domain';
import type { RideMode } from '@kc/domain';
import { useTheme } from '@kc/ui';
import { useRideCreateSheetStyles } from './rideCreateSheet.styles';
import { CityPicker } from '../../../components/CityPicker';
import { SearchChip } from '../../../components/search/SearchChip';
import { useAuthStore } from '../../../store/authStore';
import { getCreateRideListingUseCase } from '../composition/ridesComposition';
import { useRideDefaults } from '../hooks/useRideDefaults';
import { setRideLastMode } from '../lib/rideLastModeStorage';
interface Props {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function RideCreateSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const styles = useRideCreateSheetStyles();
  const { colors } = useTheme();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  const queryClient = useQueryClient();
  const defaults = useRideDefaults();

  const [step, setStep] = useState<'mode' | 'form'>('mode');
  const [mode, setMode] = useState<RideMode>('offer');
  const [originCity, setOriginCity] = useState<{ id: string; name: string } | null>(null);
  const [destCity, setDestCity] = useState<{ id: string; name: string } | null>(null);
  const [departsAt, setDepartsAt] = useState(() => new Date());
  const [seats, setSeats] = useState(3);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('mode');
      setErrorKey(null);
      return;
    }
    if (!defaults.isLoading) {
      setMode(defaults.mode);
      setOriginCity(defaults.originCity);
      setDepartsAt(new Date());
      setSeats(defaults.seatsAvailable);
      setDestCity(null);
      setDescription('');
    }
  }, [visible, defaults.isLoading, defaults.mode, defaults.originCity, defaults.seatsAvailable]);

  const departsLabel = format(departsAt, 'dd/MM/yyyy HH:mm', { locale: dateFnsHe });

  const handlePublish = async () => {
    if (!viewerId || !originCity || !destCity) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      await getCreateRideListingUseCase().execute({
        ownerId: viewerId,
        mode,
        originCityId: originCity.id,
        destCityId: destCity.id,
        departsAt: departsAt.toISOString(),
        seatsAvailable: mode === 'offer' ? seats : null,
        description: description.trim() || null,
      });
      await setRideLastMode(mode);
      await queryClient.invalidateQueries({ queryKey: ['rides'] });
      onClose();
    } catch (err) {
      if (err instanceof RideError) {
        setErrorKey(`donations.rides.errors.${err.code}`);
      } else {
        setErrorKey('donations.rides.errors.unknown');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canPublish =
    Boolean(originCity && destCity) &&
    (mode === 'request' || (seats >= 1 && seats <= 8)) &&
    !submitting;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>
              {step === 'mode' ? t('donations.rides.publishTitle') : t('donations.rides.formTitle')}
            </Text>

            {step === 'mode' ? (
              <>
                <View style={styles.chipRow}>
                  <SearchChip
                    label={t('donations.rides.modeOffer')}
                    active={mode === 'offer'}
                    onPress={() => setMode('offer')}
                  />
                  <SearchChip
                    label={t('donations.rides.modeRequest')}
                    active={mode === 'request'}
                    onPress={() => setMode('request')}
                  />
                </View>
                <Pressable style={styles.primaryBtn} onPress={() => setStep('form')}>
                  <Text style={styles.primaryBtnText}>{t('donations.rides.continue')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                {defaults.isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Text style={styles.label}>{t('donations.rides.fieldOrigin')}</Text>
                    <CityPicker value={originCity} onChange={setOriginCity} />

                    <Text style={styles.label}>{t('donations.rides.fieldDest')}</Text>
                    <CityPicker value={destCity} onChange={setDestCity} />

                    <Text style={styles.label}>{t('donations.rides.fieldDeparts')}</Text>
                    <Text style={styles.departsValue}>{departsLabel}</Text>
                    <View style={styles.chipRow}>
                      <SearchChip
                        label={t('donations.rides.departsNow')}
                        active={false}
                        onPress={() => setDepartsAt(new Date())}
                      />
                      <SearchChip
                        label={t('donations.rides.departsPlus30')}
                        active={false}
                        onPress={() => setDepartsAt(addMinutes(new Date(), 30))}
                      />
                      <SearchChip
                        label={t('donations.rides.departsPlus1h')}
                        active={false}
                        onPress={() => setDepartsAt(addHours(new Date(), 1))}
                      />
                      <SearchChip
                        label={t('donations.rides.departsPlus1d')}
                        active={false}
                        onPress={() => setDepartsAt(addDays(new Date(), 1))}
                      />
                    </View>

                    {mode === 'offer' ? (
                      <>
                        <Text style={styles.label}>{t('donations.rides.fieldSeats')}</Text>
                        <View style={styles.seatsRow}>
                          <Pressable
                            style={styles.seatBtn}
                            onPress={() => setSeats((s) => Math.max(1, s - 1))}
                          >
                            <Text style={styles.seatBtnText}>−</Text>
                          </Pressable>
                          <Text style={styles.seatsValue}>{seats}</Text>
                          <Pressable
                            style={styles.seatBtn}
                            onPress={() => setSeats((s) => Math.min(8, s + 1))}
                          >
                            <Text style={styles.seatBtnText}>+</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : null}

                    <Text style={styles.label}>{t('donations.rides.fieldDescription')}</Text>
                    <TextInput
                      style={styles.input}
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t('donations.rides.descriptionPlaceholder')}
                      placeholderTextColor={colors.textDisabled}
                      multiline
                      maxLength={500}
                      textAlign="right"
                    />

                    {errorKey ? (
                      <Text style={styles.errorText}>{t(errorKey)}</Text>
                    ) : null}

                    <Pressable
                      style={[styles.primaryBtn, !canPublish && styles.primaryBtnDisabled]}
                      onPress={() => void handlePublish()}
                      disabled={!canPublish}
                    >
                      {submitting ? (
                        <ActivityIndicator color={colors.textInverse} />
                      ) : (
                        <Text style={styles.primaryBtnText}>{t('donations.rides.publish')}</Text>
                      )}
                    </Pressable>
                    <Pressable onPress={() => setStep('mode')} style={styles.backLink}>
                      <Text style={styles.backLinkText}>{t('donations.rides.backToMode')}</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
