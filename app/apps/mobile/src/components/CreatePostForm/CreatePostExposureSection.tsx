import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, PlatformSwitch } from '@kc/ui';
import type { LocationDisplayLevel, PostVisibility } from '@kc/domain';
import { useFeedSessionStore } from '../../store/feedSessionStore';
import { createPostStyles as styles } from '../../../app/(tabs)/create.styles';
import { LocationDisplayLevelChooser } from './LocationDisplayLevelChooser';
import { VisibilityChooser } from './VisibilityChooser';

export interface CreatePostExposureSectionProps {
  open: boolean;
  onToggleOpen: () => void;
  locationDisplayLevel: LocationDisplayLevel;
  onLocationDisplayLevelChange: (next: LocationDisplayLevel) => void;
  isPublishing: boolean;
  isGive: boolean;
  urgency: string;
  onUrgencyChange: (next: string) => void;
  visibility: PostVisibility;
  onVisibilityChange: (next: PostVisibility) => void;
  profilePrivacy: 'Public' | 'Private';
  hideFromCounterparty: boolean;
  onHideFromCounterpartyChange: (next: boolean) => void;
}

export function CreatePostExposureSection({
  open,
  onToggleOpen,
  locationDisplayLevel,
  onLocationDisplayLevelChange,
  isPublishing,
  isGive,
  urgency,
  onUrgencyChange,
  visibility,
  onVisibilityChange,
  profilePrivacy,
  hideFromCounterparty,
  onHideFromCounterpartyChange,
}: Readonly<CreatePostExposureSectionProps>) {
  const { t } = useTranslation();

  return (
    <View style={styles.exposureAccordion}>
      <TouchableOpacity
        style={styles.exposureAccordionHeader}
        onPress={onToggleOpen}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={t('post.exposureSettingsSectionTitle')}
      >
        <Text style={styles.exposureAccordionTitle}>{t('post.exposureSettingsSectionTitle')}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {open ? (
        <View style={styles.exposureAccordionBody}>
          <LocationDisplayLevelChooser
            value={locationDisplayLevel}
            onChange={onLocationDisplayLevelChange}
            disabled={isPublishing}
          />

          {!isGive && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('post.urgency')}</Text>
              <TextInput
                style={styles.input}
                value={urgency}
                onChangeText={onUrgencyChange}
                placeholder={t('post.urgencyPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                textAlign="right"
                maxLength={100}
              />
            </View>
          )}

          <VisibilityChooser
            value={visibility}
            onChange={onVisibilityChange}
            profilePrivacy={profilePrivacy}
            onFollowersOnlyBlockedPress={() =>
              useFeedSessionStore.getState().showEphemeralToast(
                t('post.visibilityFollowersLockedSub'),
                'success',
                3200,
              )
            }
          />

          <View style={styles.counterpartyPrivacy}>
            <View style={styles.counterpartyPrivacyHeader}>
              <Text style={styles.counterpartyPrivacyTitle}>{t('post.createCounterpartyPrivacyTitle')}</Text>
            </View>
            <View style={styles.counterpartyPrivacyRow}>
              <Text style={styles.counterpartyPrivacyLabel}>{t('post.counterpartyMaskLabel')}</Text>
              <PlatformSwitch
                value={hideFromCounterparty}
                onValueChange={onHideFromCounterpartyChange}
                disabled={isPublishing}
              />
            </View>
            <Text style={styles.counterpartyPrivacyHint}>{t('post.createCounterpartyPrivacyHint')}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
