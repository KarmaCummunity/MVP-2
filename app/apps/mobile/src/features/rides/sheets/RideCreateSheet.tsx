// FR-RIDE-003 — publish ride sheet (items-form parity: mode toggle, full address, datetime picker).
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { RideError, type RideMode } from '@kc/domain';
import { useTheme } from '@kc/ui';
import { useCreatePostStyles } from '../../../../app/(tabs)/create.styles';
import { useRideCreateSheetStyles } from './rideCreateSheet.styles';
import { CityPicker } from '../../../components/CityPicker';
import { StreetPicker } from '../../../components/StreetPicker';
import { FormFieldLabel } from '../../../components/ui/FormFieldLabel';
import { DateTimeField } from '../../../components/ui/DateTimeField';
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
  const postStyles = useCreatePostStyles();
  const sheetStyles = useRideCreateSheetStyles();
  const { colors } = useTheme();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  const queryClient = useQueryClient();
  const defaults = useRideDefaults();

  const [mode, setMode] = useState<RideMode>('offer');
  const [originCity, setOriginCity] = useState<{ id: string; name: string } | null>(null);
  const [originStreet, setOriginStreet] = useState('');
  const [originStreetNumber, setOriginStreetNumber] = useState('');
  const [destCity, setDestCity] = useState<{ id: string; name: string } | null>(null);
  const [destStreet, setDestStreet] = useState('');
  const [destStreetNumber, setDestStreetNumber] = useState('');
  const [departsAt, setDepartsAt] = useState(() => new Date());
  const [seats, setSeats] = useState(3);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setErrorKey(null);
      return;
    }
    if (!defaults.isLoading) {
      setMode(defaults.mode);
      setOriginCity(defaults.originCity);
      setOriginStreet(defaults.originStreet);
      setOriginStreetNumber(defaults.originStreetNumber);
      setDepartsAt(new Date());
      setSeats(defaults.seatsAvailable);
      setDestCity(null);
      setDestStreet('');
      setDestStreetNumber('');
      setDescription('');
    }
  }, [visible, defaults.isLoading, defaults]);

  const handlePublish = async () => {
    if (!viewerId || !originCity || !destCity || !originStreet.trim() || !destStreet.trim()) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      await getCreateRideListingUseCase().execute({
        ownerId: viewerId,
        mode,
        originCityId: originCity.id,
        destCityId: destCity.id,
        originStreet: originStreet.trim(),
        originStreetNumber: originStreetNumber.trim() || null,
        destStreet: destStreet.trim(),
        destStreetNumber: destStreetNumber.trim() || null,
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
    Boolean(originCity && destCity && originStreet.trim() && destStreet.trim()) &&
    (mode === 'request' || (seats >= 1 && seats <= 8)) &&
    !submitting &&
    !defaults.isLoading;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={sheetStyles.overlay}>
        <Pressable style={sheetStyles.backdrop} onPress={onClose} />
        <View style={sheetStyles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={sheetStyles.scroll}>
            <Text style={sheetStyles.title}>{t('donations.rides.formTitle')}</Text>

            <View style={postStyles.typeToggle}>
              <TouchableOpacity
                style={[postStyles.typeBtn, mode === 'request' && postStyles.typeBtnActive]}
                onPress={() => setMode('request')}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === 'request' }}
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={mode === 'request' ? colors.textInverse : colors.textPrimary}
                />
                <Text
                  style={[
                    postStyles.typeBtnText,
                    mode === 'request' && postStyles.typeBtnTextActive,
                  ]}
                >
                  {t('donations.rides.modeRequest')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[postStyles.typeBtn, mode === 'offer' && postStyles.typeBtnActiveGive]}
                onPress={() => setMode('offer')}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === 'offer' }}
              >
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={mode === 'offer' ? colors.textInverse : colors.textPrimary}
                />
                <Text
                  style={[postStyles.typeBtnText, mode === 'offer' && postStyles.typeBtnTextActive]}
                >
                  {t('donations.rides.modeOffer')}
                </Text>
              </TouchableOpacity>
            </View>

            {defaults.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <>
                <View style={postStyles.section}>
                  <FormFieldLabel label={t('donations.rides.sectionOrigin')} required />
                  <CityPicker value={originCity} onChange={setOriginCity} />
                  <View style={postStyles.streetRow}>
                    <View style={postStyles.streetInputStreet}>
                      <StreetPicker
                        cityId={originCity?.id ?? null}
                        value={originStreet ? { id: '', name: originStreet } : null}
                        onChange={(sel) => setOriginStreet(sel.name)}
                      />
                    </View>
                    <TextInput
                      style={[postStyles.input, postStyles.streetInputHouse, !originCity && { opacity: 0.5 }]}
                      value={originStreetNumber}
                      onChangeText={setOriginStreetNumber}
                      placeholder={t('post.streetNumberShort')}
                      placeholderTextColor={colors.textDisabled}
                      textAlign="right"
                      editable={Boolean(originCity)}
                    />
                  </View>
                </View>

                <View style={postStyles.section}>
                  <FormFieldLabel label={t('donations.rides.sectionDest')} required />
                  <CityPicker value={destCity} onChange={setDestCity} />
                  <View style={postStyles.streetRow}>
                    <View style={postStyles.streetInputStreet}>
                      <StreetPicker
                        cityId={destCity?.id ?? null}
                        value={destStreet ? { id: '', name: destStreet } : null}
                        onChange={(sel) => setDestStreet(sel.name)}
                      />
                    </View>
                    <TextInput
                      style={[postStyles.input, postStyles.streetInputHouse, !destCity && { opacity: 0.5 }]}
                      value={destStreetNumber}
                      onChangeText={setDestStreetNumber}
                      placeholder={t('post.streetNumberShort')}
                      placeholderTextColor={colors.textDisabled}
                      textAlign="right"
                      editable={Boolean(destCity)}
                    />
                  </View>
                </View>

                <View style={postStyles.section}>
                  <FormFieldLabel label={t('donations.rides.fieldDeparts')} required />
                  <DateTimeField
                    value={departsAt}
                    onChange={setDepartsAt}
                    minimumDate={new Date()}
                  />
                </View>

                {mode === 'offer' ? (
                  <View style={postStyles.section}>
                    <FormFieldLabel label={t('donations.rides.fieldSeats')} required />
                    <View style={sheetStyles.seatsRow}>
                      <Pressable
                        style={sheetStyles.seatBtn}
                        onPress={() => setSeats((s) => Math.max(1, s - 1))}
                      >
                        <Text style={sheetStyles.seatBtnText}>−</Text>
                      </Pressable>
                      <Text style={sheetStyles.seatsValue}>{seats}</Text>
                      <Pressable
                        style={sheetStyles.seatBtn}
                        onPress={() => setSeats((s) => Math.min(8, s + 1))}
                      >
                        <Text style={sheetStyles.seatBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <View style={postStyles.section}>
                  <FormFieldLabel label={t('donations.rides.fieldDescription')} />
                  <TextInput
                    style={[postStyles.input, postStyles.textarea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('donations.rides.descriptionPlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    multiline
                    maxLength={500}
                    textAlign="right"
                  />
                </View>

                {errorKey ? <Text style={sheetStyles.errorText}>{t(errorKey)}</Text> : null}

                <Pressable
                  style={[sheetStyles.primaryBtn, !canPublish && sheetStyles.primaryBtnDisabled]}
                  onPress={() => void handlePublish()}
                  disabled={!canPublish}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={sheetStyles.primaryBtnText}>{t('donations.rides.publish')}</Text>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
