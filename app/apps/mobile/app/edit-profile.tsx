// FR-PROFILE-007 — Edit Profile screen. Reads editable fields via
// IUserRepository.getEditableProfile, lets the user change name / city /
// biography / avatar, persists via UpdateProfileUseCase. Avatar block is
// extracted into <EditProfileAvatar /> so this file stays focused on form
// orchestration.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { CityPicker } from '../src/components/CityPicker';
import { EditProfileAvatar } from '../src/components/EditProfileAvatar';
import { useAuthStore } from '../src/store/authStore';
import { getEditableProfile, getUpdateProfileUseCase } from '../src/services/userComposition';

interface InitialState {
  readonly displayName: string;
  readonly cityId: string;
  readonly cityName: string;
  readonly biography: string | null;
  readonly avatarUrl: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState<{ id: string; name: string } | null>(null);
  const [biography, setBiography] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState<InitialState | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await getEditableProfile(session.userId);
        if (cancelled) return;
        setDisplayName(p.displayName);
        setCity({ id: p.city, name: p.cityName });
        setBiography(p.biography ?? '');
        setAvatarUrl(session.avatarUrl ?? null);
        setInitial({
          displayName: p.displayName,
          cityId: p.city,
          cityName: p.cityName,
          biography: p.biography,
          avatarUrl: session.avatarUrl ?? null,
        });
      } catch (err) {
        Alert.alert('טעינה נכשלה', err instanceof Error ? err.message : 'שגיאה לא ידועה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const handleSave = async () => {
    if (!session || !initial) return;
    if (displayName.trim().length === 0 || displayName.trim().length > 50) {
      Alert.alert('שם לא תקין', 'נא להזין שם בין 1 ל־50 תווים.');
      return;
    }
    if (!city) {
      Alert.alert('עיר חסרה', 'נא לבחור עיר.');
      return;
    }
    setSaving(true);
    try {
      const trimmedName = displayName.trim();
      const trimmedBio = biography.trim();
      const newBio = trimmedBio.length === 0 ? null : trimmedBio;
      const nameChanged = trimmedName !== initial.displayName;
      const cityChanged = city.id !== initial.cityId;
      const bioChanged = newBio !== initial.biography;
      const avatarChanged = avatarUrl !== initial.avatarUrl;
      if (!nameChanged && !cityChanged && !bioChanged && !avatarChanged) {
        router.back();
        return;
      }
      const includeBasicInfo = nameChanged || cityChanged;
      await getUpdateProfileUseCase().execute({
        userId: session.userId,
        ...(includeBasicInfo
          ? { displayName: trimmedName, city: city.id, cityName: city.name }
          : {}),
        ...(bioChanged ? { biography: newBio } : {}),
        ...(avatarChanged ? { avatarUrl } : {}),
      });
      setSession({ ...session, displayName: trimmedName, avatarUrl });
      await queryClient.invalidateQueries({ queryKey: ['user-profile', session.userId] });
      router.back();
    } catch (err) {
      const code = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', mapErr(code));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <EditProfileAvatar
            userId={session?.userId ?? ''}
            displayName={displayName}
            avatarUrl={avatarUrl}
            disabled={saving}
            onChange={setAvatarUrl}
          />

          <View style={styles.field}>
            <Text style={styles.label}>שם מלא</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName}
              maxLength={50} textAlign="right" editable={!saving} placeholder="לדוגמה: רינה כהן" />
            <Text style={styles.count}>{displayName.length}/50</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>עיר</Text>
            <CityPicker value={city} onChange={setCity} disabled={saving} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ביוגרפיה (אופציונלי)</Text>
            <TextInput style={[styles.input, styles.textarea]} value={biography} onChangeText={setBiography}
              maxLength={200} multiline textAlign="right" editable={!saving}
              placeholder="קצת עליך — בלי קישורים" />
            <Text style={styles.count}>{biography.length}/200</Text>
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveText}>שמור</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mapErr(code: string): string {
  if (code.includes('invalid_display_name')) return 'שם לא תקין (1–50 תווים).';
  if (code.includes('biography_too_long')) return 'הביוגרפיה ארוכה מדי (≤200 תווים).';
  if (code.includes('biography_url_forbidden')) return 'הביוגרפיה לא יכולה להכיל קישור.';
  if (code.includes('invalid_city')) return 'עיר לא תקינה.';
  return code;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.base, paddingBottom: spacing['3xl'] },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 48,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.md },
  count: { ...typography.caption, color: colors.textDisabled, textAlign: 'left' },
  saveBtn: {
    height: 52, backgroundColor: colors.primary, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.base,
  },
  saveText: { ...typography.button, color: colors.textInverse },
});
