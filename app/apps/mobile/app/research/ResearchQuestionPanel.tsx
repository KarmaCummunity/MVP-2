// Web-only research question panel — extracted to keep [slug].web.tsx under 300 LOC.
// Displays one question card: prompt + rating row + optional text + Q11 contact fields.
// FR-RESEARCH-001 AC3, FR-RESEARCH-003 AC1.
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import type { SurveyQuestion } from '@kc/domain';
import { SurveyRatingRow } from '../../src/components/survey/SurveyRatingRow';
import {
  hebrewSurveyFieldTextStyle,
  SURVEY_TEXT_ALIGN,
} from '../../src/components/survey/hebrewSurveyFieldStyle';
import { webTextRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';

// Q11 is the final "contact us" question — identified by its position as the
// last question in the survey (design spec §9 row 11). Using sort_order keeps
// the Q11 sentinel out of the source tree (Hebrew-scan compliance).
type AnswerEntry = { rating: number | null; answerText: string | null };

type Props = {
  readonly question: SurveyQuestion;
  readonly index: number;
  readonly totalQuestions: number;
  readonly answer: AnswerEntry;
  readonly onRating: (rating: number) => void;
  readonly onText: (text: string) => void;
  readonly contactEmail: string;
  readonly contactWindowHe: string;
  readonly onContactEmail: (v: string) => void;
  readonly onContactWindow: (v: string) => void;
};

export function ResearchQuestionPanel({
  question,
  index,
  totalQuestions,
  answer,
  onRating,
  onText,
  contactEmail,
  contactWindowHe,
  onContactEmail,
  onContactWindow,
}: Props) {
  const styles = usePanelStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isQ11 = index === totalQuestions - 1;

  return (
    <View style={styles.card}>
      <Text style={styles.questionIndex}>
        {t('research.questionIndex', { index: index + 1 })}
      </Text>
      <Text style={styles.prompt}>{question.promptHe}</Text>
      {question.contextHe ? (
        <Text style={styles.context}>{question.contextHe}</Text>
      ) : null}

      <Text style={styles.fieldLabel}>{t('research.ratingFieldLabel')}</Text>
      <SurveyRatingRow
        value={answer.rating}
        onChange={onRating}
        ratingAnchorLow={question.ratingAnchorLowHe || undefined}
        ratingAnchorHigh={question.ratingAnchorHighHe || undefined}
      />

      <Text style={styles.fieldLabel}>{t('research.textFieldLabel')}</Text>
      <TextInput
        style={[styles.textInput, hebrewSurveyFieldTextStyle()]}
        value={answer.answerText ?? ''}
        onChangeText={onText}
        placeholder={question.textPlaceholderHe}
        placeholderTextColor={colors.textDisabled}
        textAlign={SURVEY_TEXT_ALIGN}
        multiline
        maxLength={500}
        accessibilityLabel={question.textPlaceholderHe}
      />

      {isQ11 ? (
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>{t('research.contactSectionTitle')}</Text>
          <Text style={styles.fieldLabel}>{t('research.contactEmailLabel')}</Text>
          <TextInput
            style={[styles.singleInput, hebrewSurveyFieldTextStyle()]}
            value={contactEmail}
            onChangeText={onContactEmail}
            placeholder={t('research.contactEmailPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            textAlign={SURVEY_TEXT_ALIGN}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={320}
            accessibilityLabel={t('research.contactEmailLabel')}
          />
          <Text style={styles.fieldLabel}>{t('research.contactWindowLabel')}</Text>
          <TextInput
            style={[styles.singleInput, hebrewSurveyFieldTextStyle()]}
            value={contactWindowHe}
            onChangeText={onContactWindow}
            placeholder={t('research.contactWindowPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            textAlign={SURVEY_TEXT_ALIGN}
            maxLength={200}
            accessibilityLabel={t('research.contactWindowLabel')}
          />
        </View>
      ) : null}
    </View>
  );
}

const usePanelStyles = makeUseStyles(({ colors }) => ({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionIndex: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  prompt: {
    ...typography.h3,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    lineHeight: 26,
    ...webTextRtl,
  },
  context: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    lineHeight: 23,
    ...webTextRtl,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.xs,
    ...webTextRtl,
  },
  textInput: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 88,
    maxHeight: 128,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  contactSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  singleInput: {
    ...typography.body,
    fontSize: 15,
    height: 44,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
}));
