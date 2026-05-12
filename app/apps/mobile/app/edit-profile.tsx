// FR-PROFILE-007 — Edit Profile (getEditableProfile + UpdateProfileUseCase).
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import { EditProfileAddressBlock } from '../src/components/EditProfileAddressBlock';
import { EditProfileAvatar } from '../src/components/EditProfileAvatar';
import { useAuthStore } from '../src/store/authStore';
import { getEditableProfile, getUpdateProfileUseCase } from '../src/services/userComposition';
import { mapEditProfileSaveError } from '../src/lib/editProfileSaveErrors';

interface InitialState {
  readonly displayName: string;
  readonly cityId: string;
  readonly cityName: string;
  readonly profileStreet: string | null;
  readonly profileStreetNumber: string | null;
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
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
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
        setStreet(p.profileStreet ?? '');
        setStreetNumber(p.profileStreetNumber ?? '');
        setBiography(p.biography ?? '');
        setAvatarUrl(p.avatarUrl ?? session.avatarUrl ?? null);
        setInitial({
          displayName: p.displayName,
          cityId: p.city,
          cityName: p.cityName,
          profileStreet: p.profileStreet,
          profileStreetNumber: p.profileStreetNumber,
          biography: p.biography,
          avatarUrl: p.avatarUrl ?? session.avatarUrl ?? null,
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
    const ts = street.trim();
    const tn = streetNumber.trim();
    if (ts.length > 0 && tn.length === 0) {
      Alert.alert('כתובת לא מלאה', 'נא למלא גם מספר בית, או למחוק את שם הרחוב.');
      return;
    }
    if (tn.length > 0 && ts.length === 0) {
      Alert.alert('כתובת לא מלאה', 'נא למלא שם רחוב, או למחוק את מספר הבית.');
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
      const nextStreet = ts.length === 0 ? null : ts;
      const nextNum = tn.length === 0 ? null : tn;
      const addrChanged =
        (nextStreet ?? null) !== (initial.profileStreet ?? null) ||
        (nextNum ?? null) !== (initial.profileStreetNumber ?? null);
      if (!nameChanged && !cityChanged && !bioChanged && !avatarChanged && !addrChanged) {
        router.back();
        return;
      }
      const includeBasicInfo = nameChanged || cityChanged;
      const profileAddress = addrChanged ? { street: nextStreet, streetNumber: nextNum } : undefined;
      await getUpdateProfileUseCase().execute({
        userId: session.userId,
        ...(includeBasicInfo
          ? { displayName: trimmedName, city: city.id, cityName: city.name }
          : {}),
        ...(profileAddress !== undefined ? { profileAddress } : {}),
        ...(bioChanged ? { biography: newBio } : {}),
        ...(avatarChanged ? { avatarUrl } : {}),
      });
      setSession({ ...session, displayName: trimmedName, avatarUrl });
      await queryClient.invalidateQueries({ queryKey: ['user-profile', session.userId] });
      router.back();
    } catch (err) {
      const code = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', mapEditProfileSaveError(code));
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
          <EditProfileAddressBlock
            city={city}
            onCityChange={setCity}
            street={street}
            streetNumber={streetNumber}
            onStreetChange={setStreet}
            onStreetNumberChange={setStreetNumber}
            disabled={saving}
          />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.base, paddingBottom: spacing['3xl'] },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary, minHeight: 48,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.md },
  count: { ...typography.caption, color: colors.textDisabled, textAlign: 'left' },
  saveBtn: {
    height: 52, backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', marginTop: spacing.base,
  },
  saveText: { ...typography.button, color: colors.textInverse },
});
