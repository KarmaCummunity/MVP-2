// FR-RIDE-038 — user-facing rating summary.
import type { UserRideRatingSummary } from '@kc/domain';
import type { IRideRatingRepository } from '../ports/IRideRatingRepository';

/** Privacy threshold (FR-RIDE-038 AC2). */
export const RATING_DISPLAY_MIN_COUNT = 3;

export interface GetUserRideRatingSummaryResult {
  readonly summary: UserRideRatingSummary | null;
  /** Use this to gate rendering — false = "עדיין מעט דירוגים". */
  readonly shouldDisplay: boolean;
}

export class GetUserRideRatingSummaryUseCase {
  constructor(private readonly repo: IRideRatingRepository) {}

  async execute(userId: string): Promise<GetUserRideRatingSummaryResult> {
    const summary = await this.repo.summaryFor(userId);
    return {
      summary,
      shouldDisplay: Boolean(summary && summary.ratingsCount >= RATING_DISPLAY_MIN_COUNT),
    };
  }
}
