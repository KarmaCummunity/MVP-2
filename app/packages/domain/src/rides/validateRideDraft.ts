import type {
  RideCargoSpec,
  RideFoodSpec,
  RidePaymentSpec,
  RideRequirementsSpec,
} from './RideAdvancedFields';
import { RIDE_CARGO_TYPE_SLUGS } from './RideAdvancedFields';
import type { RideMode } from './RideMode';
import { RideError } from './RideError';

export interface RideDraftInput {
  mode: RideMode;
  originCityId: string;
  destCityId: string;
  originStreet: string;
  destStreet: string;
  departsAt: string;
  seatsAvailable: number | null;
  description: string | null;
  // FR-RIDE-026..029 — optional advanced sections.
  cargo?: RideCargoSpec;
  food?: RideFoodSpec;
  payment?: RidePaymentSpec;
  requirements?: RideRequirementsSpec;
}

export function validateRideDraft(input: RideDraftInput): void {
  const originStreet = input.originStreet.trim();
  const destStreet = input.destStreet.trim();
  if (!originStreet || originStreet.length > 80) {
    throw new RideError('origin_street_required', 'origin street required');
  }
  if (!destStreet || destStreet.length > 80) {
    throw new RideError('dest_street_required', 'destination street required');
  }
  if (
    input.originCityId === input.destCityId &&
    originStreet === destStreet
  ) {
    throw new RideError('same_route', 'origin and destination must differ');
  }
  if (input.mode === 'offer' && input.seatsAvailable == null) {
    throw new RideError('seats_required', 'offer listings require seats');
  }
  if (input.mode === 'request' && input.seatsAvailable != null) {
    throw new RideError('seats_forbidden', 'request listings cannot have seats');
  }

  // FR-RIDE-026 + FR-RIDE-027 — cargo / food mutual exclusivity.
  if (input.cargo?.enabled && input.food?.enabled) {
    throw new RideError(
      'cargo_food_mutually_exclusive',
      'cargo and food shipping cannot coexist on the same ride',
    );
  }

  // FR-RIDE-026 — cargo bounds.
  if (input.cargo) {
    validateCargo(input.cargo);
  }

  // FR-RIDE-027 — food bounds.
  if (input.food) {
    validateFood(input.food);
  }

  // FR-RIDE-028 + FR-RIDE-040 — payment.
  if (input.payment) {
    validatePayment(input.payment, input.originCityId === input.destCityId);
  }

  // FR-RIDE-029 — requirements (enum guard only; semantic checks are server-side).
  if (input.requirements && !['any', 'women_only', 'men_only'].includes(input.requirements.gender)) {
    throw new RideError('invalid_gender_requirement', 'invalid gender requirement');
  }
}

function validateCargo(cargo: RideCargoSpec): void {
  if (!cargo.enabled) {
    if (
      cargo.maxVolumeL != null ||
      cargo.maxWeightKg != null ||
      (cargo.allowedTypes != null && cargo.allowedTypes.length > 0)
    ) {
      throw new RideError('cargo_invalid_bounds', 'cargo bounds set while disabled');
    }
    return;
  }
  if (cargo.maxVolumeL == null || cargo.maxVolumeL < 1 || cargo.maxVolumeL > 1000) {
    throw new RideError('cargo_invalid_bounds', 'cargo max volume must be 1..1000 liters');
  }
  if (cargo.maxWeightKg == null || cargo.maxWeightKg < 1 || cargo.maxWeightKg > 200) {
    throw new RideError('cargo_invalid_bounds', 'cargo max weight must be 1..200 kg');
  }
  if (!cargo.allowedTypes || cargo.allowedTypes.length === 0 || cargo.allowedTypes.length > 4) {
    throw new RideError('cargo_types_required', 'cargo requires 1..4 allowed types');
  }
  for (const slug of cargo.allowedTypes) {
    if (!RIDE_CARGO_TYPE_SLUGS.includes(slug)) {
      throw new RideError('cargo_types_required', `unknown cargo type slug: ${slug}`);
    }
  }
}

function validateFood(food: RideFoodSpec): void {
  if (!food.enabled) {
    if (food.maxKg != null || food.chilled != null) {
      throw new RideError('food_invalid_bounds', 'food bounds set while disabled');
    }
    return;
  }
  if (food.maxKg == null || food.maxKg < 1 || food.maxKg > 50) {
    throw new RideError('food_invalid_bounds', 'food max weight must be 1..50 kg');
  }
  if (food.chilled == null) {
    throw new RideError('food_invalid_bounds', 'food chilled flag is required when enabled');
  }
}

function validatePayment(payment: RidePaymentSpec, isIntracity: boolean): void {
  if (payment.model === 'free') {
    if (payment.amountIls != null) {
      throw new RideError('payment_amount_forbidden', 'free rides cannot carry an amount');
    }
    return;
  }
  if (payment.model !== 'expense_share') {
    throw new RideError('invalid_payment_model', 'invalid payment model');
  }
  if (payment.amountIls == null || payment.amountIls < 1) {
    throw new RideError('payment_amount_required', 'expense-share rides require an amount');
  }
  const cap = isIntracity ? 20 : 70;
  if (payment.amountIls > cap) {
    throw new RideError(
      'payment_cap_exceeded',
      `payment cap is ₪${cap} for ${isIntracity ? 'intracity' : 'intercity'} rides`,
    );
  }
}
