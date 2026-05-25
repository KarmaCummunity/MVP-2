import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import { SURVEY_DEMO_RATINGS } from './surveyDemoQuestions';

type SurveyRatingRowProps = {
  readonly value: number | null;
  readonly onChange: (value: number) => void;
};

export function SurveyRatingRow({ value, onChange }: SurveyRatingRowProps) {
  const styles = useRatingStyles();
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {SURVEY_DEMO_RATINGS.map((n) => {
        const selected = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.cell, selected && styles.cellSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={t('surveyDemo.ratingCellA11y', { value: n })}
          >
            <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useRatingStyles = makeUseStyles(({ colors }) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    minWidth: 36,
    aspectRatio: 1,
    maxHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cellText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cellTextSelected: {
    color: colors.textInverse,
  },
}));
