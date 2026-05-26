// ResearchRunner — extracted from [slug].web.tsx to stay under 300-LOC cap.
// Renders the live question runner: map + question panel + floating nav + submit.
// FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003.
import React from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography } from '@kc/ui';
import { PublicResearchError } from '@kc/domain';
import type { PublicResearchBundle } from '@kc/domain';
import { SurveyQuestionMap } from '../../src/components/survey/SurveyQuestionMap';
import {
  SURVEY_FLOAT_NAV_CLEARANCE,
  SurveyFloatingNav,
} from '../../src/components/survey/SurveyFloatingNav';
import { webTextRtl, webViewRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';
import { ResearchQuestionPanel } from './ResearchQuestionPanel';

export type AnswerEntry = { rating: number | null; answerText: string | null };

export function errorKey(err: unknown): string {
  if (err instanceof PublicResearchError) {
    if (err.code === 'rate_limited') return 'research.errorRateLimited';
    if (err.code === 'circuit_open') return 'research.errorCircuitOpen';
    if (err.code === 'survey_not_found') return 'research.errorSurveyNotFound';
  }
  return 'research.errorGeneric';
}

type RunnerProps = {
  readonly bundle: PublicResearchBundle;
  readonly activeIndex: number;
  readonly setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly answers: Record<string, AnswerEntry>;
  readonly onAnswerChange: (qid: string, rating: number | null, text: string | null) => void;
  readonly contactEmail: string;
  readonly contactWindowHe: string;
  readonly setContactEmail: (v: string) => void;
  readonly setContactWindowHe: (v: string) => void;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly submitError: unknown;
  readonly onRetry: () => void;
};

export function ResearchRunner({
  bundle,
  activeIndex,
  setActiveIndex,
  answers,
  onAnswerChange,
  contactEmail,
  contactWindowHe,
  setContactEmail,
  setContactWindowHe,
  onSubmit,
  submitting,
  submitError,
  onRetry,
}: RunnerProps) {
  const styles = useRunnerStyles();
  const { t } = useTranslation();
  const questions = bundle.questions;
  const total = questions.length;
  const question = questions[activeIndex];
  const answer = answers[question.id] ?? { rating: null, answerText: null };
  const allRated = questions.every((q) => (answers[q.id]?.rating ?? null) !== null);

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(total - 1, i + 1));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <View style={[styles.progressRow, webViewRtl]}>
        <Text style={styles.progressText}>
          {t('research.progress', { current: activeIndex + 1, total })}
        </Text>
        <Text style={styles.progressHint}>{t('research.progressHint')}</Text>
      </View>

      <SurveyQuestionMap
        questions={questions}
        activeIndex={activeIndex}
        answers={answers}
        onSelect={setActiveIndex}
        variant="chips"
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: SURVEY_FLOAT_NAV_CLEARANCE + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ResearchQuestionPanel
          question={question}
          index={activeIndex}
          answer={answer}
          onRating={(rating) => onAnswerChange(question.id, rating, answer.answerText)}
          onText={(text) => onAnswerChange(question.id, answer.rating, text)}
          contactEmail={contactEmail}
          contactWindowHe={contactWindowHe}
          onContactEmail={setContactEmail}
          onContactWindow={setContactWindowHe}
        />

        {submitError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t(errorKey(submitError))}</Text>
            <Pressable style={styles.retryBtn} onPress={onRetry}>
              <Text style={styles.retryBtnText}>{t('research.retryBtn')}</Text>
            </Pressable>
          </View>
        ) : null}

        {allRated ? (
          <Pressable
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.submitBtnText}>
              {submitting ? t('research.submitting') : t('research.submitBtn')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <SurveyFloatingNav
        onPrev={goPrev}
        onNext={goNext}
        prevDisabled={activeIndex === 0}
        nextDisabled={activeIndex >= total - 1}
        bottom={spacing.xl}
      />
    </KeyboardAvoidingView>
  );
}

const useRunnerStyles = makeUseStyles(({ colors }) => ({
  flex: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  progressText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
    ...webTextRtl,
  },
  progressHint: {
    ...typography.caption,
    color: colors.textSecondary,
    ...webTextRtl,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    gap: spacing.base,
  },
  errorBox: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: 12,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: {
    ...typography.button,
    color: colors.textPrimary,
    ...webTextRtl,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 17,
    ...webTextRtl,
  },
}));
