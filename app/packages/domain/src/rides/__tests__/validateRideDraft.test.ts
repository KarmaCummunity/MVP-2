import { describe, expect, it } from 'vitest';
import { validateRideDraft } from '../validateRideDraft';
import { RideError } from '../RideError';

describe('validateRideDraft', () => {
  const base = {
    mode: 'offer' as const,
    originCityId: '5000',
    destCityId: '4000',
    originStreet: 'רחוב א',
    destStreet: 'רחוב ב',
    departsAt: new Date(Date.now() + 3600_000).toISOString(),
    seatsAvailable: 3,
    description: null,
  };

  it('rejects identical route (same city and street)', () => {
    expect(() =>
      validateRideDraft({
        ...base,
        destCityId: '5000',
        destStreet: 'רחוב א',
      }),
    ).toThrow(RideError);
  });

  it('allows same city when streets differ', () => {
    expect(() =>
      validateRideDraft({
        ...base,
        destCityId: '5000',
        destStreet: 'רחוב ב',
      }),
    ).not.toThrow();
  });

  it('requires seats for offer', () => {
    expect(() => validateRideDraft({ ...base, seatsAvailable: null })).toThrow(RideError);
  });

  it('forbids seats on request', () => {
    expect(() =>
      validateRideDraft({ ...base, mode: 'request', seatsAvailable: 2 }),
    ).toThrow(RideError);
  });

  // FR-RIDE-026..029 — advanced fields.
  describe('advanced fields', () => {
    it('rejects cargo enabled without bounds', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          cargo: { enabled: true, maxVolumeL: null, maxWeightKg: 10, allowedTypes: ['furniture'] },
        }),
      ).toThrow(RideError);
    });

    it('rejects cargo volume out of bounds', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          cargo: { enabled: true, maxVolumeL: 9999, maxWeightKg: 10, allowedTypes: ['furniture'] },
        }),
      ).toThrow(RideError);
    });

    it('rejects unknown cargo type slug', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          cargo: {
            enabled: true,
            maxVolumeL: 100,
            maxWeightKg: 30,
            // @ts-expect-error — intentionally malformed
            allowedTypes: ['unicorn'],
          },
        }),
      ).toThrow(RideError);
    });

    it('rejects when both cargo and food are enabled', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          cargo: { enabled: true, maxVolumeL: 100, maxWeightKg: 30, allowedTypes: ['furniture'] },
          food: { enabled: true, maxKg: 5, chilled: true },
        }),
      ).toThrow(RideError);
    });

    it('rejects food enabled without bounds', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          food: { enabled: true, maxKg: null, chilled: true },
        }),
      ).toThrow(RideError);
    });

    it('rejects payment cap exceeded (intercity)', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          payment: { model: 'expense_share', amountIls: 71 },
        }),
      ).toThrow(RideError);
    });

    it('rejects payment cap exceeded (intracity)', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          originCityId: '5000',
          destCityId: '5000',
          originStreet: 'A',
          destStreet: 'B',
          payment: { model: 'expense_share', amountIls: 21 },
        }),
      ).toThrow(RideError);
    });

    it('accepts payment at the intercity cap', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          payment: { model: 'expense_share', amountIls: 70 },
        }),
      ).not.toThrow();
    });

    it('rejects free with amount set', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          payment: { model: 'free', amountIls: 10 },
        }),
      ).toThrow(RideError);
    });

    it('accepts a valid full advanced payload', () => {
      expect(() =>
        validateRideDraft({
          ...base,
          cargo: {
            enabled: true,
            maxVolumeL: 150,
            maxWeightKg: 40,
            allowedTypes: ['furniture', 'small_packages'],
          },
          payment: { model: 'expense_share', amountIls: 35 },
          requirements: {
            gender: 'women_only',
            smokingAllowed: false,
            petsAllowed: true,
            verifiedOnly: true,
          },
        }),
      ).not.toThrow();
    });
  });
});
