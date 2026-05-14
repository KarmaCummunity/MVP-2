// FR-AUTH-010..012 — consistent onboarding chrome: skip · step · back.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@kc/ui';

export interface OnboardingStepHeaderProps {
  readonly step: 1 | 2 | 3;
  readonly onSkip: () => void;
  readonly onBack: () => void;
  readonly skipDisabled?: boolean;
  readonly backDisabled?: boolean;
}

export function OnboardingStepHeader({
  step,
  onSkip,
  onBack,
  skipDisabled = false,
  backDisabled = false,
}: OnboardingStepHeaderProps) {
  return (
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
        שלב {step} מתוך 3
      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
