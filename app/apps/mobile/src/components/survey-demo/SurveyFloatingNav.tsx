import React from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, radius, spacing, typography, useTheme } from '@kc/ui';
import { isLayoutRtl } from '../../lib/rtlLayout';
import { webTextRtl, webViewRtl } from '../../lib/webRtlStyle';

type SurveyFloatingNavProps = {
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly prevDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly bottom: number;
};

/** Anchor floating controls to the horizontal edges (above tab bar). */
function dockHorizontalInsets(): Pick<ViewStyle, 'left' | 'right'> {
  if (Platform.OS !== 'web') {
    return { left: spacing.base, right: spacing.base };
  }
  return isLayoutRtl()
    ? { left: spacing.base, right: spacing.base }
    : { left: spacing.base, right: spacing.base };
}

export function SurveyFloatingNav({
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  bottom,
}: SurveyFloatingNavProps) {
  const styles = useNavStyles();
  const { colors } = useTheme();

  return (
    <View
      style={[styles.dock, dockHorizontalInsets(), { bottom }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPrev}
        disabled={prevDisabled}
        style={({ pressed }) => [
          styles.pill,
          styles.pillSecondary,
          prevDisabled && styles.pillDisabled,
          pressed && !prevDisabled && styles.pillPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="שאלה קודמת"
        accessibilityState={{ disabled: prevDisabled }}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={prevDisabled ? colors.textDisabled : colors.textPrimary}
        />
        <Text style={[styles.pillText, prevDisabled && styles.pillTextDisabled]}>הקודם</Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={nextDisabled}
        style={({ pressed }) => [
          styles.pill,
          styles.pillPrimary,
          nextDisabled && styles.pillDisabled,
          pressed && !nextDisabled && styles.pillPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="שאלה הבאה"
        accessibilityState={{ disabled: nextDisabled }}
      >
        <Text style={[styles.pillTextPrimary, nextDisabled && styles.pillTextDisabledOnPrimary]}>
          הבא
        </Text>
        <Ionicons
          name="chevron-back"
          size={18}
          color={nextDisabled ? colors.textDisabled : colors.textInverse}
        />
      </Pressable>
    </View>
  );
}

/** Reserve scroll space so content clears the floating nav pills. */
export const SURVEY_FLOAT_NAV_CLEARANCE = 52;

const useNavStyles = makeUseStyles(({ colors, isDark }) => ({
  dock: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    ...webViewRtl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    minHeight: 48,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.14,
    shadowRadius: 10,
    elevation: 10,
    ...webViewRtl,
  },
  pillSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  pillDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  pillPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  pillText: {
    ...typography.button,
    fontSize: 15,
    color: colors.textPrimary,
    ...webTextRtl,
  },
  pillTextPrimary: {
    ...typography.button,
    fontSize: 15,
    color: colors.textInverse,
    ...webTextRtl,
  },
  pillTextDisabled: {
    color: colors.textDisabled,
  },
  pillTextDisabledOnPrimary: {
    color: colors.textDisabled,
  },
}));
