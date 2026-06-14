// FR-ADMIN-021 — a single step in the formation checklist, merged with the
// per-journey progress state. `bodyText` / `tips` are editable content stored in
// the DB; `stepKey` keys the in-app i18n title (titleFallback is the safety net).
import type { FormationStepStatus } from './FormationJourney';

export interface FormationStep {
  readonly stepId: string;
  readonly stepKey: string;
  readonly sortOrder: number;
  readonly titleFallback: string;
  readonly bodyText: string;
  readonly tips: readonly string[];
  readonly isCriticalGate: boolean;
  readonly progressStatus: FormationStepStatus;
  readonly progressNote: string | null;
}

export function formationProgressPercent(steps: readonly FormationStep[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.progressStatus === 'done').length;
  return Math.round((done / steps.length) * 100);
}
