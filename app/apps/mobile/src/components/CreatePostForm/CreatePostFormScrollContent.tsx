import React from 'react';
import {
  ActivityIndicator, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@kc/ui';
import { ALL_CATEGORIES, ITEM_CONDITIONS } from '@kc/domain';
import type { Category, ItemCondition, LocationDisplayLevel, PostType, PostVisibility } from '@kc/domain';
import { CityPicker } from '../CityPicker';
import { CreatePostExposureSection } from './CreatePostExposureSection';
import { PhotoPicker } from './PhotoPicker';
import type { UploadedAsset } from '../../services/imageUpload';
import { createPostStyles as styles } from '../../../app/(tabs)/create.styles';
import type { CreatePostCitySelection } from '../../hooks/useCreatePostPublish';

export interface CreatePostFormScrollContentProps {
  readonly type: PostType;
  readonly onTypeChange: (next: PostType) => void;
  readonly title: string;
  readonly onTitleChange: (next: string) => void;
  readonly city: CreatePostCitySelection;
  readonly onCityChange: (selection: { id: string; name: string }) => void;
  readonly street: string;
  readonly onStreetChange: (next: string) => void;
  readonly streetNumber: string;
  readonly onStreetNumberChange: (next: string) => void;
  readonly category: Category;
  readonly onCategoryChange: (next: Category) => void;
  readonly isGive: boolean;
  readonly condition: ItemCondition;
  readonly onConditionChange: (next: ItemCondition) => void;
  readonly description: string;
  readonly onDescriptionChange: (next: string) => void;
  readonly exposureSettingsOpen: boolean;
  readonly onToggleExposureSettings: () => void;
  readonly locationDisplayLevel: LocationDisplayLevel;
  readonly onLocationDisplayLevelChange: (next: LocationDisplayLevel) => void;
  readonly isPublishing: boolean;
  readonly urgency: string;
  readonly onUrgencyChange: (next: string) => void;
  readonly visibility: PostVisibility;
  readonly onVisibilityChange: (next: PostVisibility) => void;
  readonly profilePrivacy: 'Public' | 'Private';
  readonly hideFromCounterparty: boolean;
  readonly onHideFromCounterpartyChange: (next: boolean) => void;
  readonly uploads: UploadedAsset[];
  readonly uploadingCount: number;
  readonly onAddPhotos: () => void;
  readonly onRemovePhoto: (path: string) => void;
  readonly onPublishPress: () => void;
}

export function CreatePostFormScrollContent({
  type,
  onTypeChange,
  title,
  onTitleChange,
  city,
  onCityChange,
  street,
  onStreetChange,
  streetNumber,
  onStreetNumberChange,
  category,
  onCategoryChange,
  isGive,
  condition,
  onConditionChange,
  description,
  onDescriptionChange,
  exposureSettingsOpen,
  onToggleExposureSettings,
  locationDisplayLevel,
  onLocationDisplayLevelChange,
  isPublishing,
  urgency,
  onUrgencyChange,
  visibility,
  onVisibilityChange,
  profilePrivacy,
  hideFromCounterparty,
  onHideFromCounterpartyChange,
  uploads,
  uploadingCount,
  onAddPhotos,
  onRemovePhoto,
  onPublishPress,
}: CreatePostFormScrollContentProps) {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'Request' && styles.typeBtnActive]}
          onPress={() => onTypeChange('Request')}
          accessibilityRole="button"
          accessibilityState={{ selected: type === 'Request' }}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={type === 'Request' ? colors.textInverse : colors.textPrimary}
          />
          <Text style={[styles.typeBtnText, type === 'Request' && styles.typeBtnTextActive]}>
            {t('post.request')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'Give' && styles.typeBtnActiveGive]}
          onPress={() => onTypeChange('Give')}
          accessibilityRole="button"
          accessibilityState={{ selected: type === 'Give' }}
        >
          <Ionicons
            name="gift-outline"
            size={18}
            color={type === 'Give' ? colors.textInverse : colors.textPrimary}
          />
          <Text style={[styles.typeBtnText, type === 'Give' && styles.typeBtnTextActive]}>
            {t('post.give')}
          </Text>
        </TouchableOpacity>
      </View>

      <PhotoPicker
        uploads={uploads}
        isUploading={uploadingCount > 0}
        uploadingCount={uploadingCount}
        required={isGive}
        onAdd={onAddPhotos}
        onRemove={onRemovePhoto}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t('post.title')} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={onTitleChange}
          placeholder={t('post.titlePlaceholder')}
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
          maxLength={80}
        />
        <Text style={styles.charCount}>{title.length}/80</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t('post.address')} <Text style={styles.required}>*</Text>
        </Text>
        <CityPicker value={city} onChange={onCityChange} disabled={isPublishing} />
        <View style={styles.streetRow}>
          <TextInput
            style={[styles.input, styles.streetInputStreet]}
            value={street}
            onChangeText={onStreetChange}
            placeholder={t('post.streetLabel')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
          <TextInput
            style={[styles.input, styles.streetInputHouse]}
            value={streetNumber}
            onChangeText={onStreetNumberChange}
            placeholder={t('post.streetNumberShort')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('post.categoryLabel')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {ALL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => onCategoryChange(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {t(`post.category.${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isGive && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('post.conditionLabel')}</Text>
          <View style={styles.conditionRow}>
            {ITEM_CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                onPress={() => onConditionChange(c)}
              >
                <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                  {t(`post.condition.${c}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('post.description')}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={t('post.descPlaceholder')}
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      <CreatePostExposureSection
        open={exposureSettingsOpen}
        onToggleOpen={onToggleExposureSettings}
        locationDisplayLevel={locationDisplayLevel}
        onLocationDisplayLevelChange={onLocationDisplayLevelChange}
        isPublishing={isPublishing}
        isGive={isGive}
        urgency={urgency}
        onUrgencyChange={onUrgencyChange}
        visibility={visibility}
        onVisibilityChange={onVisibilityChange}
        profilePrivacy={profilePrivacy}
        hideFromCounterparty={hideFromCounterparty}
        onHideFromCounterpartyChange={onHideFromCounterpartyChange}
      />

      <TouchableOpacity
        style={[styles.publishBtn, styles.publishBtnFooter]}
        onPress={onPublishPress}
        disabled={isPublishing}
        accessibilityState={{ disabled: isPublishing }}
      >
        {isPublishing ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <Text style={styles.publishBtnText}>{t('post.publish')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
