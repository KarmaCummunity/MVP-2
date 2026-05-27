// Survey runner state — debounced save + local answer map.
// FR-SETTINGS-016: optimistic local state with 300ms debounce on save.
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SurveyBundle, SurveyAnswerDraft } from '@kc/domain';
import { container } from '../lib/container';

type AnswerMap = Record<string, { rating: number | null; answerText: string | null }>;

function bundleToAnswerMap(bundle: SurveyBundle): AnswerMap {
  const map: AnswerMap = {};
  for (const q of bundle.questions) {
    map[q.id] = { rating: null, answerText: null };
  }
  for (const a of bundle.answers) {
    map[a.questionId] = { rating: a.rating, answerText: a.answerText };
  }
  return map;
}

function answerMapToArray(map: AnswerMap): SurveyAnswerDraft[] {
  return Object.entries(map)
    .filter(([, v]) => v.rating != null)
    .map(([questionId, v]) => ({
      questionId,
      rating: v.rating as number,
      answerText: v.answerText,
    }));
}

type SurveyRunnerState = {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  answers: AnswerMap;
  onAnswerChange: (qid: string, rating: number | null, text: string | null) => void;
  saveErrorOpen: boolean;
  setSaveErrorOpen: (open: boolean) => void;
};

export function useSurveyRunnerState(
  bundle: SurveyBundle | null,
  slug: string,
): SurveyRunnerState {
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    bundle ? bundleToAnswerMap(bundle) : {},
  );
  const [saveErrorOpen, setSaveErrorOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bundleRef = useRef<SurveyBundle | null>(bundle);

  // Re-hydrate when bundle first loads.
  useEffect(() => {
    if (bundle) {
      bundleRef.current = bundle;
      setAnswers(bundleToAnswerMap(bundle));
    }
  }, [bundle]);

  const onAnswerChange = useCallback(
    (qid: string, rating: number | null, text: string | null) => {
      setAnswers((prev) => {
        const next = { ...prev, [qid]: { rating, answerText: text } };

        // Debounced save — only fire if there's at least one valid rating.
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const b = bundleRef.current;
          if (!b) return;
          const drafts = answerMapToArray(next);
          if (drafts.length === 0) return;
          container.saveSurveyAnswers
            .execute({ slug, bundle: b, answers: drafts })
            .catch(() => setSaveErrorOpen(true));
        }, 300);

        return next;
      });
    },
    [slug],
  );

  return {
    activeIndex,
    setActiveIndex,
    answers,
    onAnswerChange,
    saveErrorOpen,
    setSaveErrorOpen,
  };
}
