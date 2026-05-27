/**
 * Public-research domain value types — FR-RESEARCH-001..003.
 * Covers Survey B (anonymous, market-research, public-facing).
 * Reuses SurveyQuestion from Survey A for question content shape.
 * Zero dependencies on node_modules (besides typescript).
 */

import type { SurveyQuestion } from '../survey/SurveyTypes';

export interface PublicResearchAnswerDraft {
  readonly questionId: string;
  readonly rating: number;
  readonly answerText: string | null;
}

export interface PublicResearchBundle {
  readonly slug: string;
  readonly titleHe: string;
  readonly version: number;
  readonly questions: readonly SurveyQuestion[];
}

export interface PublicResearchSubmission {
  readonly slug: string;
  readonly version: number;
  readonly source: string;
  readonly answers: readonly PublicResearchAnswerDraft[];
  readonly contactEmail: string | null;
  readonly contactWindowHe: string | null;
  readonly honeypot: string | null;
}

export interface PublicResearchSubmitResult {
  readonly responseId: string;
}
