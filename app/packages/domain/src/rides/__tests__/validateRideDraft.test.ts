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
});
