// FR-RIDE-026..029 — advanced-publish value objects on a ride listing.

export type RidePaymentModel = 'free' | 'expense_share';
export type RideGenderRequirement = 'any' | 'women_only' | 'men_only';

/** Canonical cargo type slugs (FR-RIDE-026 AC2). */
export const RIDE_CARGO_TYPE_SLUGS = [
  'furniture',
  'appliances',
  'small_packages',
  'other',
] as const;
export type RideCargoTypeSlug = (typeof RIDE_CARGO_TYPE_SLUGS)[number];

export interface RideCargoSpec {
  readonly enabled: boolean;
  /** 1..1000 liters when enabled, NULL otherwise. */
  readonly maxVolumeL: number | null;
  /** 1..200 kg when enabled, NULL otherwise. */
  readonly maxWeightKg: number | null;
  /** 1..4 canonical slugs when enabled, NULL otherwise. */
  readonly allowedTypes: ReadonlyArray<RideCargoTypeSlug> | null;
}

export interface RideFoodSpec {
  readonly enabled: boolean;
  /** 1..50 kg when enabled, NULL otherwise. */
  readonly maxKg: number | null;
  /** required when enabled, NULL otherwise. */
  readonly chilled: boolean | null;
}

export interface RidePaymentSpec {
  readonly model: RidePaymentModel;
  /**
   * 1..70 (intercity) or 1..20 (intracity) when model = 'expense_share';
   * NULL when model = 'free'. Server enforces the intracity sub-cap.
   */
  readonly amountIls: number | null;
}

export interface RideRequirementsSpec {
  readonly gender: RideGenderRequirement;
  readonly smokingAllowed: boolean;
  readonly petsAllowed: boolean;
  /** When true, only verified accounts can request to join (FR-RIDE-029 AC3). */
  readonly verifiedOnly: boolean;
}

/** FR-RIDE-030 — intermediate stop on a route. */
export interface RideStop {
  readonly stopId: string;
  readonly rideId: string;
  readonly sortOrder: number;
  readonly cityId: string;
  readonly cityName: string;
  readonly street: string | null;
  readonly notes: string | null;
}
