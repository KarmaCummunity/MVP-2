// Web-only public research form — FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import { container } from '../../src/lib/container';
import { webTextRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';
import { ResearchRunner, errorKey, type AnswerEntry } from './ResearchRunner';
import { SurveyIntroBlock } from './SurveyIntroBlock';
import { SurveyThankYouModal } from '../../src/components/survey/SurveyThankYouModal';
import {
  RESEARCH_SHARE_SRC_DURING_SURVEY,
} from '../../src/lib/shareResearchSurvey';
import { triggerResearchShare } from '../../src/lib/triggerResearchShare';

function persistSrc(slug: string, src: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(`kc-research-src-${slug}`, src);
  }
}

function readPersistedSrc(slug: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(`kc-research-src-${slug}`);
  }
  return null;
}

export default function PublicResearchScreen() {
  const { slug, src } = useLocalSearchParams<{ slug: string; src?: string }>();
  const router = useRouter();
  const styles = useScreenStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({});
  const [contactEmail, setContactEmail] = useState('');
  const [contactWindowHe, setContactWindowHe] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [missingRatingsHint, setMissingRatingsHint] = useState(false);

  const effectiveSrc = src ?? readPersistedSrc(slug) ?? 'direct';

  useEffect(() => {
    if (src) persistSrc(slug, src);
  }, [slug, src]);

  const bundleQuery = useQuery({
    queryKey: ['public-research-bundle', slug] as const,
    queryFn: () => container.loadPublicResearchBundle.execute(slug),
    enabled: Boolean(slug),
  });

  const bundle = bundleQuery.data;

  const onAnswerChange = useCallback(
    (qid: string, rating: number | null, text: string | null) => {
      setAnswers((prev) => ({ ...prev, [qid]: { rating, answerText: text } }));
      setMissingRatingsHint(false);
    },
    [],
  );

  const handleShare = useCallback(async () => {
    await triggerResearchShare(RESEARCH_SHARE_SRC_DURING_SURVEY, {
      title: t('research.share.shareTitle'),
      message: t('research.share.endSurveyMessage'),
      toastShared: t('research.share.statusShared'),
      toastCopied: t('research.share.statusCopied'),
      toastFailed: t('research.share.statusFailed'),
    });
  }, [t]);

  async function submitAnswers(): Promise<boolean> {
    if (!bundle) return false;
    setSubmitting(true);
    setSubmitError(null);

    const answersArray = bundle.questions.map((q) => ({
      questionId: q.id,
      rating: answers[q.id]?.rating ?? 1,
      answerText: answers[q.id]?.answerText ?? null,
    }));

    try {
      await container.submitPublicResearchResponse.execute({
        slug,
        version: bundle.version,
        source: effectiveSrc,
        answers: answersArray,
        contactEmail: contactEmail.trim() || null,
        contactWindowHe: contactWindowHe.trim() || null,
        honeypot: honeypot || null,
      });
      return true;
    } catch (err) {
      setSubmitError(err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttemptFinish() {
    if (!bundle) return;
    const firstUnrated = bundle.questions.findIndex(
      (q) => (answers[q.id]?.rating ?? null) === null,
    );
    if (firstUnrated >= 0) {
      setActiveIndex(firstUnrated);
      setMissingRatingsHint(true);
      return;
    }
    const ok = await submitAnswers();
    if (ok) setThankYouOpen(true);
  }

  function handleThankYouDismiss() {
    setThankYouOpen(false);
    router.replace('/research/thanks');
  }

  function renderBody() {
    if (bundleQuery.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{t('research.loading')}</Text>
        </View>
      );
    }
    if (bundleQuery.isError || !bundle || bundle.questions.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t(errorKey(bundleQuery.error))}</Text>
        </View>
      );
    }
    return (
      <ResearchRunner
        bundle={bundle}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        answers={answers}
        onAnswerChange={onAnswerChange}
        contactEmail={contactEmail}
        contactWindowHe={contactWindowHe}
        setContactEmail={setContactEmail}
        setContactWindowHe={setContactWindowHe}
        onAttemptFinish={handleAttemptFinish}
        submitting={submitting}
        submitError={submitError}
        onRetry={() => setSubmitError(null)}
        missingRatingsHint={missingRatingsHint}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <input
        name="hp_field"
        style={{ position: 'absolute', left: -9999, height: 0, width: 0, opacity: 0 }}
        aria-hidden
        tabIndex={-1}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      <SurveyIntroBlock />
      <View style={styles.runnerArea}>{renderBody()}</View>

      <SurveyThankYouModal
        visible={thankYouOpen}
        variant="publicResearch"
        onDismiss={handleThankYouDismiss}
        onShare={handleShare}
      />
    </View>
  );
}

const useScreenStyles = makeUseStyles(({ colors }) => ({
  screen: { flex: 1 },
  runnerArea: { flex: 1, minHeight: 0 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    ...webTextRtl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
}));
