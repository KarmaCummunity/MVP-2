// Create Post screen
// Mapped to: SRS §3.3.3
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@kc/domain';
import type { PostType, Category, ItemCondition } from '@kc/domain';

type PostVisibility = 'Public' | 'FollowersOnly' | 'OnlyMe';

export default function CreatePostScreen() {
  const router = useRouter();
  const [type, setType] = useState<PostType>('Give');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [urgency, setUrgency] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('Public');
  const [loading, setLoading] = useState(false);

  const isGive = type === 'Give';

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('חסרה כותרת', 'יש להזין כותרת לפוסט');
      return;
    }
    if (isGive && title.trim().length < 3) {
      Alert.alert('כותרת קצרה מדי', 'הכותרת חייבת להכיל לפחות 3 תווים');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    Alert.alert('✅ הפוסט שלך פורסם!', '', [
      { text: 'אוקיי', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פוסט חדש</Text>
        <TouchableOpacity
          style={[styles.publishBtn, loading && { opacity: 0.7 }]}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.publishBtnText}>פרסם</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Type toggle */}
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

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            כותרת <Text style={styles.required}>*</Text>
          </Text>
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

        {/* Description */}
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

        {/* Category */}
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

        {/* Condition (Give only) */}
        {isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>מצב החפץ</Text>
            <View style={styles.conditionRow}>
              {(['New', 'LikeNew', 'Good', 'Fair'] as ItemCondition[]).map((c) => {
                const labels: Record<ItemCondition, string> = {
                  New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני',
                };
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.conditionBtn, condition === c && styles.conditionBtnActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                      {labels[c]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Urgency (Request only) */}
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
            />
          </View>
        )}

        {/* Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>מי יראה את הפוסט</Text>
          {([
            { v: 'Public', label: '🌍 כולם' },
            { v: 'OnlyMe', label: '🔒 רק אני' },
          ] as { v: PostVisibility; label: string }[]).map(({ v, label }) => (
            <TouchableOpacity
              key={v}
              style={[styles.visibilityRow, visibility === v && styles.visibilityRowActive]}
              onPress={() => setVisibility(v)}
            >
              <View style={[styles.radio, visibility === v && styles.radioActive]} />
              <Text style={styles.visibilityLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo placeholder */}
        {isGive && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              תמונות <Text style={styles.required}>* (חובה עבור "לתת")</Text>
            </Text>
            <TouchableOpacity style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
              <Text style={styles.photoText}>הוסף תמונה</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerClose: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  publishBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  publishBtnText: { ...typography.button, color: colors.textInverse },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['3xl'] },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.requestTagBg },
  typeBtnActiveGive: { backgroundColor: colors.giveTagBg },
  typeBtnText: { ...typography.button, color: colors.textSecondary },
  typeBtnTextActive: { color: colors.textPrimary },
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 48,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  charCount: { ...typography.caption, color: colors.textDisabled, textAlign: 'left' },
  chips: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginLeft: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  conditionRow: { flexDirection: 'row', gap: spacing.sm },
  conditionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  conditionBtnActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  conditionText: { ...typography.label, color: colors.textSecondary },
  conditionTextActive: { color: colors.primary },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  visibilityRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  visibilityLabel: { ...typography.body, color: colors.textPrimary, textAlign: 'right', flex: 1 },
  photoPlaceholder: {
    height: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoText: { ...typography.body, color: colors.textSecondary },
});
