// FR-RIDE-037 — submit a rating about the counterpart on a ride.
import { RideError } from '@kc/domain';
import type { RideRating } from '@kc/domain';
import type {
  IRideRatingRepository,
  SubmitRideRatingInput,
} from '../ports/IRideRatingRepository';

export class SubmitRideRatingUseCase {
  constructor(private readonly repo: IRideRatingRepository) {}

  async execute(input: SubmitRideRatingInput): Promise<RideRating> {
    if (input.stars < 1 || input.stars > 5) {
      throw new RideError('rating_window_closed', 'stars must be 1..5');
    }
    if (input.comment && input.comment.length > 300) {
      throw new RideError('description_too_long', 'comment exceeds 300 characters');
    }
    return this.repo.submit(input);
  }
}
