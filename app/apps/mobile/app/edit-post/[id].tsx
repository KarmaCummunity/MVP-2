// FR-POST-008, FR-POST-009, FR-POST-015 AC1, FR-ADMIN-006. Edit form for open posts (owner or super-admin).
// FR-POST-005 — images: same picker + upload pipeline as create.
// Closes TD-130.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@kc/ui';
import { ALL_CATEGORIES, CATEGORY_LABELS, canUpgradeVisibility } from '@kc/domain';
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
import { styles } from './editPostScreen.styles';

const POST_IMAGES_BUCKET = 'post-images';
function assetUrl(path: string): string {
  return getSupabaseClient().storage.from(POST_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
      Alert.alert('שגיאה', 'יש להתחבר מחדש לפני שמירת פוסט.');
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
      Alert.alert('העלאת התמונה נכשלה', err instanceof Error ? err.message : 'נסה שוב.');
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
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        window.alert(`שמירה נכשלה: ${message}`);
      } else {
        Alert.alert('שמירה נכשלה', message);
      }
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
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסט</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
          <Text style={styles.retryText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState icon="search-outline" title="הפוסט לא נמצא" subtitle="ייתכן שהוא נסגר או שאין לך הרשאה לצפייה." />
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
          title="אין הרשאה"
          subtitle="רק בעל הפוסט או מנהל על יכולים לערוך אותו."
        />
      </SafeAreaView>
    );
  }

  if (post.status !== 'open') {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="lock-closed-outline"
          title="לא ניתן לערוך"
          subtitle={post.status === 'expired' ? 'הפוסט פג תוקף. פרסם אותו מחדש כדי לערוך.' : 'הפוסט הוסר על ידי מנהל ולא ניתן לעריכה.'}
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

  const onlyMeDisabled = !canUpgradeVisibility('Public', 'OnlyMe') && post.visibility === 'Public';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>עריכת פוסט</Text>
        <TouchableOpacity
          style={[styles.saveBtn, (isSaving || !isFormValid) && { opacity: 0.5 }]}
          onPress={() => save.mutate()}
          disabled={isSaving || !isFormValid}
          accessibilityState={{ disabled: isSaving || !isFormValid }}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>שמור</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Read-only type badge */}
        <View style={[styles.typeBadge, isGive ? styles.typeBadgeGive : styles.typeBadgeRequest]}>
          <Text style={styles.typeBadgeText}>{isGive ? '🎁 לתת חפץ' : '🔍 לבקש חפץ'}</Text>
          <Text style={styles.typeBadgeSub}>לא ניתן לשנות את סוג הפוסט לאחר פרסום</Text>
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
          <CityPicker value={city} onChange={setCity} disabled={isSaving} />
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
              {(['New', 'LikeNew', 'Good', 'Fair'] as ItemCondition[]).map((c) => {
                const labels: Record<ItemCondition, string> = { New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני' };
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>{labels[c]}</Text>
                  </TouchableOpacity>
                );
              })}
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

        {/* Visibility — upgrade-only (FR-POST-009) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>מי יראה את הפוסט</Text>
          {([
            { v: 'Public' as PostVisibility, label: '🌍 כולם', sub: 'הפוסט יוצג בפיד הראשי לכל המשתמשים' },
            { v: 'OnlyMe' as PostVisibility, label: '🔒 רק אני', sub: onlyMeDisabled ? 'לא ניתן להוריד פרטיות לאחר פרסום' : 'הפוסט נשמר באופן פרטי' },
          ]).map(({ v, label, sub }) => {
            const isDisabled = v === 'OnlyMe' && onlyMeDisabled;
            return (
              <TouchableOpacity
                key={v}
                style={[styles.visRow, visibility === v && styles.visRowActive, isDisabled && styles.visRowDisabled]}
                onPress={() => !isDisabled && handleVisibilityChange(v)}
                disabled={isDisabled}
              >
                <View style={[styles.radio, visibility === v && styles.radioActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.visLabel, isDisabled && { color: colors.textDisabled }]}>{label}</Text>
                  <Text style={styles.visSub}>{sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
