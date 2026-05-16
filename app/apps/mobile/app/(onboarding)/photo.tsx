// Onboarding step 3 — FR-AUTH-011 (camera+gallery, resize+upload, skip→silhouette).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { PhotoSourceSheet } from '../../src/components/PhotoSourceSheet';
import { AnimatedEntry } from '../../src/components/animations/AnimatedEntry';
import { HeroHalo } from '../../src/components/animations/HeroHalo';
import { PressableScale } from '../../src/components/animations/PressableScale';
import { staggerDelay } from '../../src/lib/animations/motion';
import { useOnboardingPhotoFlow } from '../../src/hooks/useOnboardingPhotoFlow';

const HALO_SIZE = 196;
const AVATAR_SIZE = 128;

export default function OnboardingPhotoScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const {
    session, avatarUrl, hasAvatar,
    uploading, finalizing, busy,
    pick, remove, finalize, goBack,
  } = useOnboardingPhotoFlow();

  const handlePick = async (source: Parameters<typeof pick>[0]) => {
    setSheetVisible(false);
    await pick(source);
  };
  const handleRemove = async () => {
    setSheetVisible(false);
    await remove();
  };
  const openSheet = () => !busy && setSheetVisible(true);

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

        <AnimatedEntry delay={staggerDelay(0)} style={styles.avatarWrap}>
          <PressableScale
            onPress={openSheet}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={hasAvatar ? 'החלפת תמונת פרופיל' : 'הוספת תמונת פרופיל'}
          >
            <HeroHalo size={HALO_SIZE}>
              <AvatarInitials
                name={session?.displayName ?? 'משתמש'}
                avatarUrl={avatarUrl}
                size={AVATAR_SIZE}
              />
            </HeroHalo>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={18} color={colors.textInverse} />
            </View>
            {uploading && (
              <View style={styles.avatarSpinner}>
                <ActivityIndicator color={colors.textInverse} size="large" />
              </View>
            )}
          </PressableScale>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(1)}>
          <Text style={styles.title}>תמונת פרופיל</Text>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(2)}>
          <Text style={styles.subtitle}>פנים מוכרות עוזרות לבנות אמון בקהילה.</Text>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(3)} style={styles.changeBtnWrap}>
          <PressableScale
            style={[styles.changeBtn, busy && { opacity: 0.5 }]}
            onPress={openSheet}
            disabled={busy}
          >
            <Ionicons
              name={hasAvatar ? 'swap-horizontal-outline' : 'image-outline'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.changeBtnText}>
              {hasAvatar ? 'החלף תמונה' : 'בחר תמונה'}
            </Text>
          </PressableScale>
        </AnimatedEntry>

        <View style={{ flex: 1 }} />

        <AnimatedEntry delay={staggerDelay(4)}>
          <PressableScale
            style={[styles.cta, busy && { opacity: 0.7 }]}
            onPress={finalize}
            disabled={busy}
          >
            {finalizing ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Text style={styles.ctaText}>
                  {hasAvatar ? 'המשך עם התמונה' : 'המשך ללא תמונה'}
                </Text>
                <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
              </>
            )}
          </PressableScale>
        </AnimatedEntry>

        <AnimatedEntry delay={staggerDelay(5)}>
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
  avatarWrap: { alignItems: 'center', marginTop: spacing.base, marginBottom: spacing.xs },
  cameraBadge: {
    position: 'absolute',
    bottom: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.surface,
  },
  avatarSpinner: {
    position: 'absolute',
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  changeBtnWrap: { alignItems: 'center' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  changeBtnText: { ...typography.button, color: colors.primary },
  cta: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaText: { ...typography.button, color: colors.textInverse, fontSize: 16 },
  hint: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
