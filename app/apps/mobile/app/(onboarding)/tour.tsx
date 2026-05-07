// Onboarding step 3 — FR-AUTH-012
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';

interface Slide {
  readonly emoji: string;
  readonly title: string;
  readonly body: string;
}

const SLIDES: readonly Slide[] = [
  {
    emoji: '🎁',
    title: 'תן ובקש',
    body: 'פרסם פריטים שאתה רוצה לתת או חפש דברים שאתה צריך — הכל בתוך הקהילה שלך.',
  },
  {
    emoji: '💬',
    title: 'תאמו בצ׳אט',
    body: 'כל פוסט פותח שיחה ישירה. תאמו איסוף, אמצו את הפריט, וצרו קשר אנושי.',
  },
  {
    emoji: '✅',
    title: 'סמן כנמסר',
    body: 'אחרי שהפריט עבר ידיים — סמן את הפוסט כסגור. ככה כולנו רואים את הקהילה זזה.',
  },
];

export default function OnboardingTourScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)');
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skip}>דלג</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleNext}>
          <Text style={styles.ctaText}>{isLast ? 'בואו נתחיל' : 'הבא'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    alignItems: 'flex-start',
  },
  skip: { ...typography.body, color: colors.primary },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 96, marginBottom: spacing.xl },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
