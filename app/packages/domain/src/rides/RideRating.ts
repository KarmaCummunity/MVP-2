// FR-RIDE-037..039 — rating entity + user aggregate.

export interface RideRating {
  readonly ratingId: string;
  readonly rideId: string;
  readonly raterId: string;
  readonly rateeId: string;
  readonly stars: 1 | 2 | 3 | 4 | 5;
  readonly comment: string | null;
  readonly isPenalty: boolean;
  readonly createdAt: string;
}

export interface UserRideRatingSummary {
  readonly userId: string;
  readonly ratingsCount: number;
  readonly avgStars: number;
  readonly lastRatedAt: string | null;
}
