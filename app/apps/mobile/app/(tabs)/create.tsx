// Create Post — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-POST-001..006, FR-POST-010 (delete) lives elsewhere.
// FR-AUTH-015 soft-gate preserved from #12 — Publish wraps publish.mutate() with requestSoftGate.
// FR-NOTIF-015 AC1: push pre-prompt fires after first post published.
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@kc/ui';
import {
  ALL_CATEGORIES, CATEGORY_LABELS, ITEM_CONDITIONS, ITEM_CONDITION_LABELS_HE,
} from '@kc/domain';
import type { Category, ItemCondition, LocationDisplayLevel, PostType } from '@kc/domain';
import { isPostError } from '@kc/application';
import { useAuthStore } from '../../src/store/authStore';
import { useFeedSessionStore } from '../../src/store/feedSessionStore';
import { useLastAddressStore } from '../../src/store/lastAddressStore';
import { useSoftGate } from '../../src/components/OnboardingSoftGate';
import { getCreatePostUseCase, getPostRepo } from '../../src/services/postsComposition';
import { usePushPermissionGate, registerCurrentDeviceIfPermitted } from '../../src/lib/notifications';
import { EnablePushModal } from '../../src/components/EnablePushModal';
import { container } from '../../src/lib/container';
import { buildCreatePostMissingFieldsToastMessage } from '../../src/lib/createPostMissingFieldsToast';
import { useCreatePostAddressPrefill } from '../../src/hooks/useCreatePostAddressPrefill';
import {
  newUploadBatchId, pickPostImages, resizeAndUploadImage, type UploadedAsset,
} from '../../src/services/imageUpload';
import { CityPicker } from '../../src/components/CityPicker';
import { LocationDisplayLevelChooser } from '../../src/components/CreatePostForm/LocationDisplayLevelChooser';
import { PhotoPicker } from '../../src/components/CreatePostForm/PhotoPicker';
import { VisibilityChooser } from '../../src/components/CreatePostForm/VisibilityChooser';
import { mapPostErrorToHebrew } from '../../src/services/postMessages';
import { invalidatePersonalStatsCaches } from '../../src/lib/invalidatePersonalStatsCaches';
import { NotifyModal } from '../../src/components/NotifyModal';
import { createPostStyles as styles } from './create.styles';

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const { requestSoftGate } = useSoftGate();
  const ownerId = session?.userId;
  const { modalState, presentPrePrompt, handleAccept, handleDecline } = usePushPermissionGate();
  const checkedFirstPostRef = useRef(false);

  const {
    city,
    street,
    streetNumber,
    setCity,
    setStreet,
    setStreetNumber,
  } = useCreatePostAddressPrefill(ownerId);

  const [type, setType] = useState<PostType>('Give');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [urgency, setUrgency] = useState('');
  const [locationDisplayLevel, setLocationDisplayLevel] =
    useState<LocationDisplayLevel>('CityAndStreet');
  const [visibility, setVisibility] = useState<'Public' | 'OnlyMe'>('Public');

  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [batchId] = useState(() => newUploadBatchId());
  // TD-138 — Alert.alert is a no-op on react-native-web; route both
  // "must re-auth" and upload-failure feedback through NotifyModal so
  // web users get the same message as iOS / Android.
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  const isGive = type === 'Give';

  const handlePick = async () => {
    if (!ownerId) {
      setNotify({ title: 'שגיאה', message: 'יש להתחבר מחדש לפני פרסום פוסט.' });
      return;
    }
    const picked = await pickPostImages(uploads.length + uploadingCount);
    if (picked.length === 0) return;

    setUploadingCount((n) => n + picked.length);
    try {
      // Audit §3.8 — allSettled keeps successes (orphans reaped by cron 0079).
      const startOrdinal = uploads.length;
      const r = await Promise.allSettled(
        picked.map((p, i) => resizeAndUploadImage(p, ownerId, batchId, startOrdinal + i)),
      );
      const ok = r.flatMap((x) => (x.status === 'fulfilled' ? [x.value] : []));
      if (ok.length > 0) setUploads((prev) => [...prev, ...ok]);
      if (ok.length < r.length) {
        const msg = ok.length === 0 ? 'נסה שוב.' : `${ok.length}/${r.length} הועלו — נסה שוב את היתר.`;
        setNotify({ title: 'העלאת התמונה נכשלה', message: msg });
      }
    } finally {
      setUploadingCount((n) => Math.max(0, n - picked.length));
    }
  };

  const handleRemove = (path: string) =>
    setUploads((prev) => prev.filter((u) => u.path !== path));

  // Capture open-post count before the publish so we can detect the very first post
  // without a race. Stored in a ref so it survives across the async publish call.
  const prePublishOpenCountRef = useRef<number | null>(null);

  const publish = useMutation({
    mutationFn: async () => {
      if (!ownerId) throw new Error('not_authenticated');
      if (!city) throw new Error('city_required');
      if (!checkedFirstPostRef.current) {
        try {
          prePublishOpenCountRef.current = await getPostRepo().countOpenByUser(ownerId);
        } catch {
          // Non-critical — skip push gate on error.
        }
      }
      return getCreatePostUseCase().execute({
        ownerId,
        type,
        visibility,
        title,
        description: description.trim() ? description : null,
        category,
        address: { city: city.id, cityName: city.name, street, streetNumber },
        locationDisplayLevel,
        itemCondition: isGive ? condition : null,
        urgency: !isGive && urgency.trim() ? urgency : null,
        mediaAssets: uploads.map((u) => ({ path: u.path, mimeType: u.mimeType, sizeBytes: u.sizeBytes })),
      });
    },
    onSuccess: async () => {
      // Persist the address so the next post pre-fills these fields.
      if (city) {
        useLastAddressStore.getState().setLastAddress({
          cityId: city.id,
          cityName: city.name,
          street,
          streetNumber,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['my-open-count'] });
      await queryClient.invalidateQueries({ queryKey: ['openPostsCount'] });
      invalidatePersonalStatsCaches(queryClient, ownerId);
      useFeedSessionStore.getState().showEphemeralToast(t('post.publishSuccess'), 'success');
      // FR-NOTIF-015 AC1: present push pre-prompt after first post published.
      if (!checkedFirstPostRef.current && ownerId) {
        checkedFirstPostRef.current = true;
        if (prePublishOpenCountRef.current === 0) {
          void presentPrePrompt('first-post-published');
        }
      }
      router.replace('/(tabs)');
    },
    onError: (err) => {
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
      useFeedSessionStore.getState().showEphemeralToast(`פרסום נכשל: ${message}`, 'error');
    },
  });

  const isPublishing = publish.isPending || uploadingCount > 0;

  const tryPublish = () => {
    if (isPublishing) return;
    const missingMsg = buildCreatePostMissingFieldsToastMessage({
      isGive,
      title,
      city,
      street,
      streetNumber,
      uploadsLength: uploads.length,
    });
    if (missingMsg.length > 0) {
      useFeedSessionStore.getState().showEphemeralToast(missingMsg, 'error', 2500);
      return;
    }
    requestSoftGate(() => publish.mutate());
  };

  // FR-AUTH-015: gate publish on onboarding_state. requestSoftGate runs publish
  // immediately if state !== pending_basic_info; otherwise opens the modal first.

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פוסט חדש</Text>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={tryPublish}
          disabled={isPublishing}
          accessibilityState={{ disabled: isPublishing }}
        >
          {isPublishing ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.publishBtnText}>פרסם</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'Request' && styles.typeBtnActive]}
            onPress={() => setType('Request')}
            accessibilityRole="button"
            accessibilityState={{ selected: type === 'Request' }}
          >
            <Ionicons name="search-outline" size={18} color={type === 'Request' ? colors.textInverse : colors.textPrimary} />
            <Text style={[styles.typeBtnText, type === 'Request' && styles.typeBtnTextActive]}>
              {t('post.request')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'Give' && styles.typeBtnActiveGive]}
            onPress={() => setType('Give')}
            accessibilityRole="button"
            accessibilityState={{ selected: type === 'Give' }}
          >
            <Ionicons name="gift-outline" size={18} color={type === 'Give' ? colors.textInverse : colors.textPrimary} />
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
          onAdd={handlePick}
          onRemove={handleRemove}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>כותרת <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="מה אתה נותן/מבקש?"
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
          <CityPicker value={city} onChange={setCity} disabled={isPublishing} />
          <View style={styles.streetRow}>
            <TextInput
              style={[styles.input, styles.streetInputStreet]}
              value={street}
              onChangeText={setStreet}
              placeholder="רחוב"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
            <TextInput
              style={[styles.input, styles.streetInputHouse]}
              value={streetNumber}
              onChangeText={setStreetNumber}
              placeholder="מס׳"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionLabel}>קטגוריה</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {ALL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>מצב החפץ</Text>
            <View style={styles.conditionRow}>
              {ITEM_CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                    {ITEM_CONDITION_LABELS_HE[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}


<View style={styles.section}>
          <Text style={styles.sectionLabel}>תיאור (אופציונלי)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="פרטים נוספים על החפץ..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>
        <LocationDisplayLevelChooser
          value={locationDisplayLevel}
          onChange={setLocationDisplayLevel}
          disabled={isPublishing}
        />

        {!isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>דחיפות (אופציונלי)</Text>
            <TextInput
              style={styles.input}
              value={urgency}
              onChangeText={setUrgency}
              placeholder="לדוגמה: צריך עד שישי"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
              maxLength={100}
            />
          </View>
        )}

        <VisibilityChooser value={visibility} onChange={setVisibility} />

        <TouchableOpacity
          style={[styles.publishBtn, styles.publishBtnFooter]}
          onPress={tryPublish}
          disabled={isPublishing}
          accessibilityState={{ disabled: isPublishing }}
        >
          {isPublishing ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.publishBtnText}>פרסם</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <EnablePushModal
        visible={modalState.visible}
        trigger={modalState.trigger}
        onAccept={async () => {
          const status = await handleAccept();
          if (status === 'granted' && ownerId) {
            await registerCurrentDeviceIfPermitted(ownerId, { deviceRepo: container.deviceRepo });
          }
        }}
        onDecline={handleDecline}
      />
      <NotifyModal
        visible={notify !== null}
        title={notify?.title ?? ''}
        message={notify?.message ?? ''}
        onDismiss={() => setNotify(null)}
      />
    </SafeAreaView>
  );
}
