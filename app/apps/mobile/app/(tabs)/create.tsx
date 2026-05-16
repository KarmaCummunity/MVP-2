// Create Post — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-POST-001..006 (incl. FR-POST-003 visibility + FR-POST-006 followers publish confirm), FR-POST-021 (D-31 partner-surface mask + collapsible exposure settings), FR-POST-010 (delete) lives elsewhere.
// FR-AUTH-015 soft-gate preserved from #12 — Publish wraps publish.mutate() with requestSoftGate.
// FR-NOTIF-015 AC1: push pre-prompt fires after first post published.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@kc/ui';
import type { Category, ItemCondition, LocationDisplayLevel, PostType, PostVisibility } from '@kc/domain';
import { useAuthStore } from '../../src/store/authStore';
import { useSoftGate } from '../../src/components/OnboardingSoftGate';
import { usePushPermissionGate, registerCurrentDeviceIfPermitted } from '../../src/lib/notifications';
import { EnablePushModal } from '../../src/components/EnablePushModal';
import { container } from '../../src/lib/container';
import { useCreatePostAddressPrefill } from '../../src/hooks/useCreatePostAddressPrefill';
import {
  newUploadBatchId, pickPostImages, resizeAndUploadImage, type UploadedAsset,
} from '../../src/services/imageUpload';
import { NotifyModal } from '../../src/components/NotifyModal';
import { ConfirmActionModal } from '../../src/components/post/ConfirmActionModal';
import { getUserRepo } from '../../src/services/userComposition';
import { createPostStyles as styles } from './create.styles';
import { useCreatePostPublish } from '../../src/hooks/useCreatePostPublish';
import { CreatePostFormScrollContent } from '../../src/components/CreatePostForm/CreatePostFormScrollContent';

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { requestSoftGate } = useSoftGate();
  const ownerId = session?.userId;
  const { modalState, presentPrePrompt, handleAccept, handleDecline } = usePushPermissionGate();

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
  const [visibility, setVisibility] = useState<PostVisibility>('Public');
  const visibilityRef = useRef<PostVisibility>(visibility);
  visibilityRef.current = visibility;

  const [publishFollowersOpen, setPublishFollowersOpen] = useState(false);
  const [hideFromCounterparty, setHideFromCounterparty] = useState(false);
  const [exposureSettingsOpen, setExposureSettingsOpen] = useState(false);

  const userQuery = useQuery({
    queryKey: ['user-profile', ownerId],
    queryFn: () => {
      if (!ownerId) throw new Error('unreachable');
      return getUserRepo().findById(ownerId);
    },
    enabled: Boolean(ownerId),
  });
  const profilePrivacy = userQuery.data?.privacyMode ?? 'Public';

  useEffect(() => {
    if (profilePrivacy === 'Public' && visibility === 'FollowersOnly') {
      setVisibility('Public');
    }
  }, [profilePrivacy, visibility]);

  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [batchId] = useState(() => newUploadBatchId());
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  const isGive = type === 'Give';

  const handlePick = async () => {
    if (!ownerId) {
      setNotify({ title: t('general.errorTitle'), message: t('post.reauthRequired') });
      return;
    }
    const picked = await pickPostImages(uploads.length + uploadingCount);
    if (picked.length === 0) return;

    setUploadingCount((n) => n + picked.length);
    try {
      const startOrdinal = uploads.length;
      const r = await Promise.allSettled(
        picked.map((p, i) => resizeAndUploadImage(p, ownerId, batchId, startOrdinal + i)),
      );
      const ok = r.flatMap((x) => (x.status === 'fulfilled' ? [x.value] : []));
      if (ok.length > 0) setUploads((prev) => [...prev, ...ok]);
      if (ok.length < r.length) {
        const msg =
          ok.length === 0 ? t('post.uploadRetry') : t('post.uploadPartial', { ok: ok.length, total: r.length });
        setNotify({ title: t('post.uploadFailedTitle'), message: msg });
      }
    } finally {
      setUploadingCount((n) => Math.max(0, n - picked.length));
    }
  };

  const handleRemove = (path: string) =>
    setUploads((prev) => prev.filter((u) => u.path !== path));

  const { tryPublish, runPublishAfterGate, isPublishing } = useCreatePostPublish({
    ownerId,
    type,
    title,
    description,
    category,
    city,
    street,
    streetNumber,
    locationDisplayLevel,
    condition,
    isGive,
    urgency,
    uploads,
    hideFromCounterparty,
    visibilityRef,
    setPublishFollowersOpen,
    requestSoftGate,
    uploadingCount,
    presentPrePrompt,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tabs.newPost')}</Text>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={tryPublish}
          disabled={isPublishing}
          accessibilityState={{ disabled: isPublishing }}
        >
          {isPublishing ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.publishBtnText}>{t('post.publish')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <CreatePostFormScrollContent
        type={type}
        onTypeChange={setType}
        title={title}
        onTitleChange={setTitle}
        city={city}
        onCityChange={setCity}
        street={street}
        onStreetChange={setStreet}
        streetNumber={streetNumber}
        onStreetNumberChange={setStreetNumber}
        category={category}
        onCategoryChange={setCategory}
        isGive={isGive}
        condition={condition}
        onConditionChange={setCondition}
        description={description}
        onDescriptionChange={setDescription}
        exposureSettingsOpen={exposureSettingsOpen}
        onToggleExposureSettings={() => setExposureSettingsOpen((o) => !o)}
        locationDisplayLevel={locationDisplayLevel}
        onLocationDisplayLevelChange={setLocationDisplayLevel}
        isPublishing={isPublishing}
        urgency={urgency}
        onUrgencyChange={setUrgency}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        profilePrivacy={profilePrivacy}
        hideFromCounterparty={hideFromCounterparty}
        onHideFromCounterpartyChange={setHideFromCounterparty}
        uploads={uploads}
        uploadingCount={uploadingCount}
        onAddPhotos={handlePick}
        onRemovePhoto={handleRemove}
        onPublishPress={tryPublish}
      />

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
      <ConfirmActionModal
        visible={publishFollowersOpen}
        title={t('post.publishFollowersTitle')}
        message={t('post.publishFollowersBody', {
          count: userQuery.data?.followersCount ?? 0,
        })}
        confirmLabel={t('post.publishFollowersConfirmCta')}
        cancelLabel={t('post.publishFollowersMakePublicCta')}
        onCancel={() => {
          setPublishFollowersOpen(false);
          visibilityRef.current = 'Public';
          setVisibility('Public');
          runPublishAfterGate();
        }}
        onConfirm={() => {
          setPublishFollowersOpen(false);
          runPublishAfterGate();
        }}
      />
    </SafeAreaView>
  );
}
