// FR-POST-008, FR-POST-009, FR-POST-015 AC1, FR-ADMIN-006. Edit form for open posts (owner or super-admin).
// FR-POST-005 — images: same picker + upload pipeline as create.
// Closes TD-130.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { ALL_CATEGORIES, canUpgradeVisibility, ITEM_CONDITIONS } from '@kc/domain';
import type { Category, ItemCondition, LocationDisplayLevel, PostVisibility } from '@kc/domain';
import { isPostError } from '@kc/application';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useIsSuperAdmin } from '../../src/hooks/useIsSuperAdmin';
import { getPostByIdUseCase, getUpdatePostUseCase } from '../../src/services/postsComposition';
import {
  newUploadBatchId, pickPostImages, resizeAndUploadImage, type UploadedAsset,
} from '../../src/services/imageUpload';
import { CityPicker } from '../../src/components/CityPicker';
import { LocationDisplayLevelChooser } from '../../src/components/CreatePostForm/LocationDisplayLevelChooser';
import { PhotoPicker } from '../../src/components/CreatePostForm/PhotoPicker';
import { EmptyState } from '../../src/components/EmptyState';
import { mapPostErrorToHebrew } from '../../src/services/postMessages';
import { NotifyModal } from '../../src/components/NotifyModal';
import { styles } from './editPostScreen.styles';

const POST_IMAGES_BUCKET = 'post-images';
function assetUrl(path: string): string {
  return getSupabaseClient().storage.from(POST_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  const isSuperAdmin = useIsSuperAdmin();

  const query = useQuery({
    queryKey: ['post', id, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: id ?? '', viewerId }),
    enabled: Boolean(id),
  });

  // Form state — seeded once the post loads.
  const [seeded, setSeeded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [urgency, setUrgency] = useState('');
  const [city, setCity] = useState<{ id: string; name: string } | null>(null);
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [locationDisplayLevel, setLocationDisplayLevel] =
    useState<LocationDisplayLevel>('CityAndStreet');
  const [visibility, setVisibility] = useState<PostVisibility>('Public');
  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [batchId] = useState(() => newUploadBatchId());
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);

  const post = query.data?.post;

  useEffect(() => {
    setSeeded(false);
  }, [id]);

  useEffect(() => {
    if (!post || seeded) return;
    setTitle(post.title);
    setDescription(post.description ?? '');
    setCategory(post.category);
    setCondition(post.itemCondition ?? 'Good');
    setUrgency(post.urgency ?? '');
    setCity({ id: post.address.city, name: post.address.cityName });
    setStreet(post.address.street);
    setStreetNumber(post.address.streetNumber);
    setLocationDisplayLevel(post.locationDisplayLevel);
    setVisibility(post.visibility);
    setUploads(
      post.mediaAssets.map((a) => ({
        path: a.path,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        previewUri: assetUrl(a.path),
      })),
    );
    setSeeded(true);
  }, [post, seeded]);

  const handlePickImages = async () => {
    if (!viewerId) {
      setNotify({ title: t('post.editPost.notifyErrorTitle'), message: t('post.editPost.needReauthBody') });
      return;
    }
    const picked = await pickPostImages(uploads.length + uploadingCount);
    if (picked.length === 0) return;

    setUploadingCount((n) => n + picked.length);
    try {
      const startOrdinal = uploads.length;
      const results = await Promise.all(
        picked.map((p, i) => resizeAndUploadImage(p, viewerId, batchId, startOrdinal + i)),
      );
      setUploads((prev) => [...prev, ...results]);
    } catch (err) {
      setNotify({ title: t('post.editPost.uploadFailedTitle'), message: err instanceof Error ? err.message : t('post.editPost.uploadFailedFallback') });
    } finally {
      setUploadingCount((n) => Math.max(0, n - picked.length));
    }
  };

  const handleRemoveImage = (path: string) =>
    setUploads((prev) => prev.filter((u) => u.path !== path));

  const save = useMutation({
    mutationFn: async () => {
      if (!viewerId || !id) throw new Error('not_authenticated');
      if (!city) throw new Error('city_required');
      return getUpdatePostUseCase().execute({
        postId: id,
        viewerId,
        patch: {
          title,
          description: description.trim() ? description.trim() : null,
          category,
          address: { city: city.id, cityName: city.name, street, streetNumber },
          locationDisplayLevel,
          itemCondition: post?.type === 'Give' ? condition : null,
          urgency: post?.type !== 'Give' && urgency.trim() ? urgency.trim() : null,
          visibility,
          mediaAssets: uploads.map((u) => ({
            path: u.path,
            mimeType: u.mimeType,
            sizeBytes: u.sizeBytes,
          })),
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['post', id, viewerId] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    },
    onError: (err) => {
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : t('post.editPost.networkError');
      setNotify({ title: t('post.editPost.saveFailedTitle'), message });
    },
  });

  // Loading / error / not-found guards.
  if (query.isLoading || (!seeded && post != null)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{t('post.editPost.loadErrorTitle')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
          <Text style={styles.retryText}>{t('post.editPost.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState icon="search-outline" title={t('post.editPost.notFoundTitle')} subtitle={t('post.editPost.notFoundSubtitle')} />
      </SafeAreaView>
    );
  }

  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const canEdit = isOwner || isSuperAdmin;
  if (!canEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="lock-closed-outline"
          title={t('post.editPost.forbiddenTitle')}
          subtitle={t('post.editPost.forbiddenSubtitle')}
        />
      </SafeAreaView>
    );
  }

  if (post.status !== 'open') {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="lock-closed-outline"
          title={t('post.editPost.notEditableTitle')}
          subtitle={post.status === 'expired' ? t('post.editPost.notEditableExpired') : t('post.editPost.notEditableRemoved')}
        />
      </SafeAreaView>
    );
  }

  const isGive = post.type === 'Give';
  const isSaving = save.isPending || uploadingCount > 0;

  const isFormValid =
    title.trim().length > 0 &&
    city !== null &&
    street.trim().length > 0 &&
    streetNumber.trim().length > 0 &&
    (!isGive || uploads.length > 0);

  // FR-POST-009: visibility upgrade-only.
  function handleVisibilityChange(next: PostVisibility) {
    if (next === post!.visibility) { setVisibility(next); return; }
    if (!canUpgradeVisibility(post!.visibility, next)) return;
    setVisibility(next);
  }

  // FR-POST-009: visibility is upgrade-only. A row is enabled when it's the
  // current value (no-op tap) or when `canUpgradeVisibility(current, row)` is
  // true. Disabled rows render greyed with a brief reason in the subtitle.
  const isVisibilityRowEnabled = (v: PostVisibility): boolean =>
    v === post.visibility || canUpgradeVisibility(post.visibility, v);

  const DOWNGRADE_SUB = t('post.editPost.visibilityDowngradeSub');
  const VISIBILITY_ROWS: Array<{ v: PostVisibility; label: string; openSub: string }> = [
    { v: 'Public', label: t('post.editPost.visibilityPublicLabel'), openSub: t('post.editPost.visibilityPublicSub') },
    { v: 'FollowersOnly', label: t('post.editPost.visibilityFollowersLabel'), openSub: t('post.editPost.visibilityFollowersSub') },
    { v: 'OnlyMe', label: t('post.editPost.visibilityOnlyMeLabel'), openSub: t('post.editPost.visibilityOnlyMeSub') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('post.editPost.headerTitle')}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, (isSaving || !isFormValid) && { opacity: 0.5 }]}
          onPress={() => save.mutate()}
          disabled={isSaving || !isFormValid}
          accessibilityState={{ disabled: isSaving || !isFormValid }}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{t('post.editPost.saveCta')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Read-only type badge */}
        <View style={[styles.typeBadge, isGive ? styles.typeBadgeGive : styles.typeBadgeRequest]}>
          <Text style={styles.typeBadgeText}>{isGive ? t('post.editPost.typeBadgeGive') : t('post.editPost.typeBadgeRequest')}</Text>
          <Text style={styles.typeBadgeSub}>{t('post.editPost.typeBadgeSub')}</Text>
        </View>

        <PhotoPicker
          uploads={uploads}
          isUploading={uploadingCount > 0}
          uploadingCount={uploadingCount}
          required={isGive}
          onAdd={handlePickImages}
          onRemove={handleRemoveImage}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('post.editPost.sectionTitle')} <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('post.editPost.titlePlaceholder')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('post.editPost.sectionAddress')} <Text style={styles.required}>*</Text></Text>
          <CityPicker value={city} onChange={setCity} disabled={isSaving} />
          <View style={styles.streetRow}>
            <TextInput
              style={[styles.input, styles.streetInputStreet]}
              value={street}
              onChangeText={setStreet}
              placeholder={t('post.editPost.streetPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
            <TextInput
              style={[styles.input, styles.streetInputHouse]}
              value={streetNumber}
              onChangeText={setStreetNumber}
              placeholder={t('post.editPost.streetNumberPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('post.editPost.sectionDescription')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('post.editPost.descriptionPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('post.editPost.sectionCategory')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {ALL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
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
            <Text style={styles.sectionLabel}>{t('post.editPost.sectionCondition')}</Text>
            <View style={styles.conditionRow}>
              {ITEM_CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                    {t(`post.condition.${c}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <LocationDisplayLevelChooser
          value={locationDisplayLevel}
          onChange={setLocationDisplayLevel}
          disabled={isSaving}
        />

        {!isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('post.editPost.sectionUrgency')}</Text>
            <TextInput
              style={styles.input}
              value={urgency}
              onChangeText={setUrgency}
              placeholder={t('post.editPost.urgencyPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
              maxLength={100}
            />
          </View>
        )}

        {/* Visibility — upgrade-only (FR-POST-009) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('post.editPost.sectionVisibility')}</Text>
          {VISIBILITY_ROWS.map(({ v, label, openSub }) => {
            const enabled = isVisibilityRowEnabled(v);
            const sub = enabled ? openSub : DOWNGRADE_SUB;
            return (
              <TouchableOpacity
                key={v}
                style={[styles.visRow, visibility === v && styles.visRowActive, !enabled && styles.visRowDisabled]}
                onPress={() => enabled && handleVisibilityChange(v)}
                disabled={!enabled}
              >
                <View style={[styles.radio, visibility === v && styles.radioActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.visLabel, !enabled && { color: colors.textDisabled }]}>{label}</Text>
                  <Text style={styles.visSub}>{sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <NotifyModal visible={notify !== null} title={notify?.title ?? ''} message={notify?.message ?? ''} onDismiss={() => setNotify(null)} />
    </SafeAreaView>
  );
}
