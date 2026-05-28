import { useTranslation } from 'react-i18next';

export type SurveyDemoQuestion = {
  readonly id: string;
  readonly shortLabel: string;
  readonly prompt: string;
  readonly context: string;
  readonly textPlaceholder: string;
};

export const SURVEY_DEMO_QUESTION_IDS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

export type SurveyDemoQuestionId = (typeof SURVEY_DEMO_QUESTION_IDS)[number];

export function useSurveyDemoQuestions(): readonly SurveyDemoQuestion[] {
  const { t } = useTranslation();
  return SURVEY_DEMO_QUESTION_IDS.map((id) => ({
    id,
    shortLabel: t(`surveyDemo.questions.${id}.shortLabel`),
    prompt: t(`surveyDemo.questions.${id}.prompt`),
    context: t(`surveyDemo.questions.${id}.context`),
    textPlaceholder: t(`surveyDemo.questions.${id}.textPlaceholder`),
  }));
}

export const SURVEY_DEMO_RATINGS = [1, 2, 3, 4, 5, 6, 7] as const;
