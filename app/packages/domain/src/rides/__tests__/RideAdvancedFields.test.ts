import { describe, expect, it } from 'vitest';
import {
  RIDE_CARGO_TYPE_SLUGS,
  type RideCargoSpec,
  type RideCargoTypeSlug,
  type RideFoodSpec,
  type RideGenderRequirement,
  type RidePaymentModel,
  type RidePaymentSpec,
  type RideRequirementsSpec,
  type RideStop,
} from '../RideAdvancedFields';

// FR-RIDE-026..030 — advanced-publish value objects.
//
// All exports except RIDE_CARGO_TYPE_SLUGS are compile-time-only types,
// so the only runtime assertions live in the first block. The remaining
// blocks pin the documented shape/invariants of each interface via typed
// construction (verified by `tsc --noEmit`) plus `@ts-expect-error`
// boundary cases for inputs the type system must reject.
describe('RIDE_CARGO_TYPE_SLUGS', () => {
  it('exposes exactly the four canonical cargo slugs in order (AC2)', () => {
    expect(RIDE_CARGO_TYPE_SLUGS).toEqual([
      'furniture',
      'appliances',
      'small_packages',
      'other',
    ]);
  });

  it('caps the catalog at 4 entries with no duplicates', () => {
    expect(RIDE_CARGO_TYPE_SLUGS).toHaveLength(4);
    expect(new Set(RIDE_CARGO_TYPE_SLUGS).size).toBe(RIDE_CARGO_TYPE_SLUGS.length);
  });

  it('contains only non-empty lowercase slug strings', () => {
    for (const slug of RIDE_CARGO_TYPE_SLUGS) {
      expect(typeof slug).toBe('string');
      expect(slug.length).toBeGreaterThan(0);
      expect(slug).toBe(slug.toLowerCase());
    }
  });

  it('excludes values that are not part of the catalog', () => {
    expect(RIDE_CARGO_TYPE_SLUGS).not.toContain('unicorn' as RideCargoTypeSlug);
    expect((RIDE_CARGO_TYPE_SLUGS as readonly string[]).includes('passengers')).toBe(false);
  });

  it('every catalog slug is assignable to RideCargoTypeSlug', () => {
    // Each member round-trips through the literal-union type.
    const typed: RideCargoTypeSlug[] = [...RIDE_CARGO_TYPE_SLUGS];
    expect(typed).toEqual(RIDE_CARGO_TYPE_SLUGS);
  });
});

describe('RideCargoSpec shape', () => {
  it('accepts an enabled spec with all bounds + 1..4 allowed types (happy path)', () => {
    const cargo: RideCargoSpec = {
      enabled: true,
      maxVolumeL: 150,
      maxWeightKg: 40,
      allowedTypes: ['furniture', 'small_packages'],
    };
    expect(cargo.enabled).toBe(true);
    expect(cargo.allowedTypes).toHaveLength(2);
  });

  it('accepts a disabled spec with all detail fields NULL (boundary)', () => {
    const cargo: RideCargoSpec = {
      enabled: false,
      maxVolumeL: null,
      maxWeightKg: null,
      allowedTypes: null,
    };
    expect(cargo.maxVolumeL).toBeNull();
    expect(cargo.allowedTypes).toBeNull();
  });

  it('rejects an unknown cargo-type slug at the type level', () => {
    const cargo: RideCargoSpec = {
      enabled: true,
      maxVolumeL: 100,
      maxWeightKg: 30,
      // @ts-expect-error — 'unicorn' is not a RideCargoTypeSlug
      allowedTypes: ['unicorn'],
    };
    expect(cargo).toBeDefined();
  });
});

describe('RideFoodSpec shape', () => {
  it('accepts an enabled spec with maxKg + chilled set (happy path)', () => {
    const food: RideFoodSpec = { enabled: true, maxKg: 5, chilled: true };
    expect(food.maxKg).toBe(5);
    expect(food.chilled).toBe(true);
  });

  it('accepts a disabled spec with detail fields NULL (boundary)', () => {
    const food: RideFoodSpec = { enabled: false, maxKg: null, chilled: null };
    expect(food.maxKg).toBeNull();
    expect(food.chilled).toBeNull();
  });
});

describe('RidePaymentSpec shape', () => {
  it('accepts expense_share with an amount (happy path)', () => {
    const payment: RidePaymentSpec = { model: 'expense_share', amountIls: 35 };
    expect(payment.amountIls).toBe(35);
  });

  it('accepts free with a NULL amount (boundary)', () => {
    const payment: RidePaymentSpec = { model: 'free', amountIls: null };
    expect(payment.amountIls).toBeNull();
  });

  it('rejects an unknown payment model at the type level', () => {
    const payment: RidePaymentSpec = {
      // @ts-expect-error — 'crypto' is not a RidePaymentModel
      model: 'crypto',
      amountIls: null,
    };
    expect(payment).toBeDefined();
  });

  it('constrains RidePaymentModel to the two known literals', () => {
    const models: RidePaymentModel[] = ['free', 'expense_share'];
    expect(models).toHaveLength(2);
  });
});

describe('RideRequirementsSpec shape', () => {
  it('accepts a fully specified requirements block (happy path)', () => {
    const requirements: RideRequirementsSpec = {
      gender: 'women_only',
      smokingAllowed: false,
      petsAllowed: true,
      verifiedOnly: true,
    };
    expect(requirements.gender).toBe('women_only');
    expect(requirements.verifiedOnly).toBe(true);
  });

  it('constrains RideGenderRequirement to the three known literals', () => {
    const genders: RideGenderRequirement[] = ['any', 'women_only', 'men_only'];
    expect(genders).toHaveLength(3);
  });

  it('rejects an unknown gender requirement at the type level', () => {
    const requirements: RideRequirementsSpec = {
      // @ts-expect-error — 'anyone' is not a RideGenderRequirement
      gender: 'anyone',
      smokingAllowed: true,
      petsAllowed: false,
      verifiedOnly: false,
    };
    expect(requirements).toBeDefined();
  });
});

describe('RideStop shape', () => {
  it('accepts a fully populated intermediate stop (happy path)', () => {
    const stop: RideStop = {
      stopId: 'stop-1',
      rideId: 'ride-1',
      sortOrder: 0,
      cityId: '5000',
      cityName: 'תל אביב',
      street: 'דיזנגוף',
      notes: 'ליד הקניון',
    };
    expect(stop.sortOrder).toBe(0);
    expect(stop.cityName).toBe('תל אביב');
  });

  it('accepts NULL optional street/notes (boundary)', () => {
    const stop: RideStop = {
      stopId: 'stop-2',
      rideId: 'ride-1',
      sortOrder: 1,
      cityId: '4000',
      cityName: 'חיפה',
      street: null,
      notes: null,
    };
    expect(stop.street).toBeNull();
    expect(stop.notes).toBeNull();
  });
});
