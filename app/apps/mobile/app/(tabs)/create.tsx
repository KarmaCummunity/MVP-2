// Create Post — wired to IPostRepository (P0.4-FE).
// Mapped to: FR-POST-001..006, FR-POST-010 (delete) lives elsewhere.
// FR-AUTH-015 soft-gate preserved from #12 — Publish wraps publish.mutate() with requestSoftGate.
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@kc/domain';
import type { Category, ItemCondition, LocationDisplayLevel, PostType } from '@kc/domain';
import { isPostError } from '@kc/application';
import { useAuthStore } from '../../src/store/authStore';
import { useLastAddressStore } from '../../src/store/lastAddressStore';
import { useSoftGate } from '../../src/components/OnboardingSoftGate';
import { getCreatePostUseCase } from '../../src/services/postsComposition';
import {
  newUploadBatchId, pickPostImages, resizeAndUploadImage, type UploadedAsset,
} from '../../src/services/imageUpload';
import { CityPicker } from '../../src/components/CityPicker';
import { LocationDisplayLevelChooser } from '../../src/components/CreatePostForm/LocationDisplayLevelChooser';
import { PhotoPicker } from '../../src/components/CreatePostForm/PhotoPicker';
import { VisibilityChooser } from '../../src/components/CreatePostForm/VisibilityChooser';
import { mapPostErrorToHebrew } from '../../src/services/postMessages';

export default function CreatePostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const { requestSoftGate } = useSoftGate();
  const ownerId = session?.userId;

  // Pre-fill address from the last successfully published post (persisted via
  // useLastAddressStore). Lazy init reads whatever's in the store at mount —
  // for the first post in a fresh session AsyncStorage may still be hydrating;
  // a useEffect below seeds the fields once hydration finishes (without
  // overwriting user edits).
  const lastAddress = useLastAddressStore.getState();

  const [type, setType] = useState<PostType>('Give');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [urgency, setUrgency] = useState('');
  const [city, setCity] = useState<{ id: string; name: string } | null>(
    lastAddress.cityId && lastAddress.cityName
      ? { id: lastAddress.cityId, name: lastAddress.cityName }
      : null,
  );
  const [street, setStreet] = useState(lastAddress.street);
  const [streetNumber, setStreetNumber] = useState(lastAddress.streetNumber);
  const [locationDisplayLevel, setLocationDisplayLevel] =
    useState<LocationDisplayLevel>('CityAndStreet');

  // Late-hydration seed: if AsyncStorage finished loading after this screen
  // mounted, populate the address fields from the store — but only if the user
  // hasn't started editing them yet. The ref always points to the latest
  // values so the subscription closure can read them when it fires.
  const fieldsRef = useRef({ city, street, streetNumber });
  fieldsRef.current = { city, street, streetNumber };
  useEffect(() => {
    const unsub = useLastAddressStore.subscribe((s) => {
      const cur = fieldsRef.current;
      const userUntouched =
        cur.city === null && cur.street === '' && cur.streetNumber === '';
      if (!userUntouched) return;
      if (s.cityId && s.cityName) setCity({ id: s.cityId, name: s.cityName });
      if (s.street) setStreet(s.street);
      if (s.streetNumber) setStreetNumber(s.streetNumber);
    });
    return unsub;
  }, []);
  const [visibility, setVisibility] = useState<'Public' | 'OnlyMe'>('Public');

  const [uploads, setUploads] = useState<UploadedAsset[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [batchId] = useState(() => newUploadBatchId());

  const isGive = type === 'Give';

  const handlePick = async () => {
    if (!ownerId) {
      Alert.alert('שגיאה', 'יש להתחבר מחדש לפני פרסום פוסט.');
      return;
    }
    const picked = await pickPostImages(uploads.length + uploadingCount);
    if (picked.length === 0) return;

    setUploadingCount((n) => n + picked.length);
    try {
      const startOrdinal = uploads.length;
      const results = await Promise.all(
        picked.map((p, i) => resizeAndUploadImage(p, ownerId, batchId, startOrdinal + i)),
      );
      setUploads((prev) => [...prev, ...results]);
    } catch (err) {
      Alert.alert('העלאת התמונה נכשלה', err instanceof Error ? err.message : 'נסה שוב.');
    } finally {
      setUploadingCount((n) => Math.max(0, n - picked.length));
    }
  };

  const handleRemove = (path: string) =>
    setUploads((prev) => prev.filter((u) => u.path !== path));

  const publish = useMutation({
    mutationFn: async () => {
      if (!ownerId) throw new Error('not_authenticated');
      if (!city) throw new Error('city_required');
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
      // Web: Alert.alert renders as window.confirm in RN-Web and is often
      // invisible inside iframe previews. Navigate immediately and surface
      // success via a query param the feed reads to flash a toast banner.
      if (Platform.OS === 'web') {
        router.replace('/(tabs)?published=1');
      } else {
        Alert.alert('✅ הפוסט שלך פורסם!', '', [{ text: 'אוקיי', onPress: () => router.replace('/(tabs)') }]);
      }
    },
    onError: (err) => {
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        window.alert(`פרסום נכשל: ${message}`);
      } else {
        Alert.alert('פרסום נכשל', message);
      }
    },
  });

  const isPublishing = publish.isPending || uploadingCount > 0;

  // FR-POST-002 AC4: Publish stays disabled until required fields are populated.
  // streetNumber regex is enforced server-side and surfaced via use-case +
  // adapter mapping; we only block on presence here.
  const isFormValid =
    title.trim().length > 0 &&
    city !== null &&
    street.trim().length > 0 &&
    streetNumber.trim().length > 0 &&
    (!isGive || uploads.length > 0);

  // FR-AUTH-015: gate publish on onboarding_state. requestSoftGate runs publish
  // immediately if state !== pending_basic_info; otherwise opens the modal first.
  const handlePublish = () => {
    requestSoftGate(() => publish.mutate());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פוסט חדש</Text>
        <TouchableOpacity
          style={[styles.publishBtn, (isPublishing || !isFormValid) && { opacity: 0.5 }]}
          onPress={handlePublish}
          disabled={isPublishing || !isFormValid}
          accessibilityState={{ disabled: isPublishing || !isFormValid }}
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
          >
            <Text style={[styles.typeBtnText, type === 'Request' && styles.typeBtnTextActive]}>
              🔍 לבקש חפץ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'Give' && styles.typeBtnActiveGive]}
            onPress={() => setType('Give')}
          >
            <Text style={[styles.typeBtnText, type === 'Give' && styles.typeBtnTextActive]}>
              🎁 לתת חפץ
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
              style={[styles.input, { flex: 2 }]}
              value={street}
              onChangeText={setStreet}
              placeholder="רחוב"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
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

        <LocationDisplayLevelChooser
          value={locationDisplayLevel}
          onChange={setLocationDisplayLevel}
          disabled={isPublishing}
        />

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerClose: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  publishBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.md, minWidth: 60, alignItems: 'center' },
  publishBtnText: { ...typography.button, color: colors.textInverse },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['3xl'] },
  typeToggle: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' },
  typeBtn: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.requestTagBg },
  typeBtnActiveGive: { backgroundColor: colors.giveTagBg },
  typeBtnText: { ...typography.button, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.textPrimary },
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 48,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  charCount: { ...typography.caption, color: colors.textDisabled, textAlign: 'left' },
  streetRow: { flexDirection: 'row', gap: spacing.sm },
  chips: { flexDirection: 'row' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, marginLeft: spacing.sm, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  conditionRow: { flexDirection: 'row', gap: spacing.sm },
  conditionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  conditionBtnActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  conditionText: { ...typography.label, color: colors.textSecondary },
  conditionTextActive: { color: colors.primary },
});
