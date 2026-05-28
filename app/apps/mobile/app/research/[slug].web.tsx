// Web-only public research form — FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003.
// FR-RESEARCH-004 placement 2 lives inside SurveyIntroBlock (extracted file).
// .web.tsx extension: file is excluded from iOS/Android bundles entirely.
// Heavy sub-components extracted: ResearchRunner.tsx, ResearchQuestionPanel.tsx, SurveyIntroBlock.tsx.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import { container } from '../../src/lib/container';
import { webTextRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';
import { ResearchRunner, errorKey, type AnswerEntry } from './ResearchRunner';
import { SurveyIntroBlock } from './SurveyIntroBlock';

// ─── src persistence helpers ─────────────────────────────────────────────────

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

// ─── screen ───────────────────────────────────────────────────────────────────

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
    },
    [],
  );

  async function handleSubmit() {
    if (!bundle) return;
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
      router.replace('/research/thanks');
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
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
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        onRetry={() => setSubmitError(null)}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Honeypot — hidden from humans, passed to RPC (FR-RESEARCH-002 AC1) */}
      <input
        name="hp_field"
        style={{ position: 'absolute', left: -9999, height: 0, width: 0, opacity: 0 }}
        aria-hidden
        tabIndex={-1}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      >
        <SurveyIntroBlock />
        <View style={styles.flex}>{renderBody()}</View>
      </ScrollView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const useScreenStyles = makeUseStyles(({ colors }) => ({
  screen: { flex: 1 },
  flex: { flex: 1 },
  pageContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, gap: spacing.base },
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
