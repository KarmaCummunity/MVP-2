import type { IRideMatchScorer } from './ports/IRideMatchScorer';

/** FR-RIDE-010 — V2.0 sorts by departure time only. */
export class ChronologicalRideMatchScorer implements IRideMatchScorer {
  sort<T extends { departsAt: string }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => a.departsAt.localeCompare(b.departsAt));
  }
}
