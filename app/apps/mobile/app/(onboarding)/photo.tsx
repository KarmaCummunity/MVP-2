// Onboarding step 2 — FR-AUTH-011 (full slice B: camera + gallery + resize + upload).
// AC1 camera+gallery · AC2 resize 1024 + JPEG q=0.85 · AC3 skip → silhouette ·
// AC4 SSO-prefilled, replaceable/removable · AC5 errors recoverable.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { PhotoSourceSheet } from '../../src/components/PhotoSourceSheet';
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';
import { useOnboardingPhotoFlow } from '../../src/hooks/useOnboardingPhotoFlow';

export default function OnboardingPhotoScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const {
    session,
    avatarUrl,
    hasAvatar,
    uploading,
    finalizing,
    busy,
    pick,
    remove,
    finalize,
    goBack,
  } = useOnboardingPhotoFlow();

  const handlePick = async (source: Parameters<typeof pick>[0]) => {
    setSheetVisible(false);
    await pick(source);
  };

  const handleRemove = async () => {
    setSheetVisible(false);
    await remove();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <OnboardingStepHeader
          step={3}
          onSkip={finalize}
          onBack={goBack}
          skipDisabled={busy}
          backDisabled={busy}
        />

        <AnimatedEntry delay={staggerDelay(0)}>
          <Text style={styles.title}>תמונת פרופיל</Text>
          <Text style={styles.subtitle}>אפשר להוסיף עכשיו או בהמשך</Text>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(1)}>
          <PressableScale
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
          </PressableScale>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(2)}>
          <PressableScale
            style={[styles.changeBtn, busy && { opacity: 0.5 }]}
            onPress={() => setSheetVisible(true)}
            disabled={busy}
          >
            <Text style={styles.changeBtnText}>
              {hasAvatar ? 'החלף תמונה' : 'בחר תמונה'}
            </Text>
          </PressableScale>
        </AnimatedEntry>

        <View style={{ flex: 1 }} />

        <AnimatedEntry delay={staggerDelay(3)}>
          <PressableScale
            style={[styles.cta, busy && { opacity: 0.7 }]}
            onPress={finalize}
            disabled={busy}
          >
            {finalizing ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.ctaText}>
                {hasAvatar ? 'המשך עם התמונה הנוכחית' : 'המשך ללא תמונה'}
              </Text>
            )}
          </PressableScale>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(4)}>
          <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בהגדרות.</Text>
        </AnimatedEntry>
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
