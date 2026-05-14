// Onboarding step 4 — FR-AUTH-012
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { OnboardingStepHeader } from '../../src/components/OnboardingStepHeader';
import { TourSlidePager, type TourSlide } from '../../src/components/animations/TourSlidePager';
import { PressableScale } from '../../src/components/animations/PressableScale';

const SLIDES: readonly TourSlide[] = [
  {
    icon: 'gift-outline',
    title: 'תן ובקש',
    body: 'פרסם פריטים שאתה רוצה לתת או בקש דברים שאתה צריך, תמיד אפשר גם לחפש — הכל בקהילה.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'תאמו בצ׳אט',
    body: 'פותחים שיחה במהירות ישר דרך הפוסט, מתאמים איסוף בקלות, ומחזקים את הקהילה!',
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'סמן כנמסר',
    body: 'אחרי שהפריט עבר ידיים — סמן את הפוסט כסגור. ככה כולנו רואים את הקהילה זזה.',
  },
];

export default function OnboardingTourScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) router.replace('/(tabs)');
    else setIndex(index + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPad}>
        <OnboardingStepHeader
          step={4}
          onSkip={() => router.replace('/(tabs)')}
          onBack={() => router.replace('/(onboarding)/photo')}
        />
      </View>
      <TourSlidePager slides={SLIDES} index={index} onIndexChange={setIndex} />
      <View style={styles.footer}>
        <PressableScale
          style={styles.cta}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'בואו נתחיל' : 'הבא'}
        >
          <Text style={styles.ctaText}>{isLast ? 'בואו נתחיל' : 'הבא'}</Text>
          <Ionicons name="arrow-back" size={20} color={colors.textInverse} />
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerPad: { paddingHorizontal: spacing.xl, paddingTop: spacing.base },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
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
});
