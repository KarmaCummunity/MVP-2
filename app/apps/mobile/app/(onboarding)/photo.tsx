// Onboarding step 2 — FR-AUTH-011 (full slice B: camera + gallery + resize + upload).
// AC1 camera+gallery · AC2 resize 1024 + JPEG q=0.85 · AC3 skip → silhouette ·
// AC4 SSO-prefilled, replaceable/removable · AC5 errors recoverable.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { PhotoSourceSheet } from '../../src/components/PhotoSourceSheet';
import { useAuthStore } from '../../src/store/authStore';
import { getCompleteOnboardingUseCase, getSetAvatarUseCase } from '../../src/services/userComposition';
import { pickAvatarImage, resizeAndUploadAvatar, type AvatarSource } from '../../src/services/imageUpload';

export default function OnboardingPhotoScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const onboardingState = useAuthStore((s) => s.onboardingState);
  const setSession = useAuthStore((s) => s.setSession);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const avatarUrl = session?.avatarUrl ?? null;
  const hasAvatar = !!avatarUrl;
  const busy = uploading || finalizing;

  const handlePick = async (source: AvatarSource) => {
    setSheetVisible(false);
    if (!session) return;
    setUploading(true);
    try {
      const picked = await pickAvatarImage(source);
      if (!picked) return; // user cancelled or denied permission
      const url = await resizeAndUploadAvatar(picked, session.userId);
      await getSetAvatarUseCase().execute({ userId: session.userId, avatarUrl: url });
      setSession({ ...session, avatarUrl: url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('העלאת התמונה נכשלה', `אפשר לדלג ולהוסיף תמונה מאוחר יותר.\n${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setSheetVisible(false);
    if (!session) return;
    setUploading(true);
    try {
      await getSetAvatarUseCase().execute({ userId: session.userId, avatarUrl: null });
      setSession({ ...session, avatarUrl: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('הסרת התמונה נכשלה', msg);
    } finally {
      setUploading(false);
    }
  };

  const finalize = async () => {
    if (!session) return;
    setFinalizing(true);
    try {
      if (onboardingState === 'pending_avatar') {
        await getCompleteOnboardingUseCase().execute({ userId: session.userId });
        setOnboardingState('completed');
      }
      router.replace('/(onboarding)/tour');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', msg);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.step}>שלב 2 מתוך 3</Text>
          <TouchableOpacity onPress={finalize} disabled={busy} accessibilityRole="button">
            <Text style={styles.skip}>דלג</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>תמונת פרופיל</Text>
        <Text style={styles.subtitle}>אפשר להוסיף עכשיו או בהמשך</Text>

        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => !busy && setSheetVisible(true)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={hasAvatar ? 'החלפת תמונת פרופיל' : 'הוספת תמונת פרופיל'}
        >
          <AvatarInitials
            name={session?.displayName ?? 'משתמש'}
            avatarUrl={avatarUrl}
            size={120}
          />
          {uploading && (
            <View style={styles.avatarSpinner}>
              <ActivityIndicator color={colors.textInverse} size="large" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.changeBtn, busy && { opacity: 0.5 }]}
          onPress={() => setSheetVisible(true)}
          disabled={busy}
        >
          <Text style={styles.changeBtnText}>
            {hasAvatar ? 'החלף תמונה' : 'בחר תמונה'}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={[styles.cta, busy && { opacity: 0.7 }]} onPress={finalize} disabled={busy}>
          {finalizing ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.ctaText}>
              {hasAvatar ? 'המשך עם התמונה הנוכחית' : 'המשך ללא תמונה'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בהגדרות.</Text>
      </View>

      <PhotoSourceSheet
        visible={sheetVisible}
        canRemove={hasAvatar}
        onPick={handlePick}
        onRemove={handleRemove}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.base,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  skip: { ...typography.body, color: colors.primary },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.lg },
  avatarSpinner: {
    position: 'absolute',
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  changeBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  changeBtnText: { ...typography.button, color: colors.primary },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
  hint: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
