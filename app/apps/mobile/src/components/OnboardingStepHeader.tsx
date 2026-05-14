// FR-AUTH-018 + FR-AUTH-010..012 — onboarding chrome: skip · step · back (4 steps).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@kc/ui';
import { OnboardingProgressBar } from './animations/OnboardingProgressBar';

export interface OnboardingStepHeaderProps {
  readonly step: 1 | 2 | 3 | 4;
  readonly onSkip: () => void;
  /** Omitted on step 1 (no back affordance). */
  readonly onBack?: () => void;
  readonly skipDisabled?: boolean;
  readonly backDisabled?: boolean;
}

export function OnboardingStepHeader({
  step,
  onSkip,
  onBack = () => {},
  skipDisabled = false,
  backDisabled = false,
}: OnboardingStepHeaderProps) {
  const showBack = step > 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onSkip}
          disabled={skipDisabled}
          accessibilityRole="button"
          accessibilityLabel="דלג"
          style={styles.side}
        >
          <Text style={[styles.skip, skipDisabled && styles.muted]}>דלג</Text>
        </TouchableOpacity>
        <Text style={styles.step} accessibilityRole="text">
          שלב {step} מתוך 4
        </Text>
        {showBack ? (
          <Pressable
            onPress={onBack}
            disabled={backDisabled}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
            hitSlop={12}
            style={({ pressed }) => [styles.side, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name="arrow-forward"
              size={22}
              color={backDisabled ? colors.textDisabled : colors.primary}
            />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
      </View>
      <OnboardingProgressBar step={step} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  side: { minWidth: 72, justifyContent: 'center', alignItems: 'center' },
  step: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  skip: { ...typography.body, color: colors.primary, textAlign: 'right' },
  muted: { color: colors.textDisabled },
});
