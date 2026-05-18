import { describe, it, expect } from 'vitest';
import { applyAddressResetOnCityChange } from '../addressResetOnCityChange';

describe('applyAddressResetOnCityChange', () => {
  it('keeps street + number when the city id is unchanged', () => {
    expect(
      applyAddressResetOnCityChange({
        prevCityId: '5000',
        nextCityId: '5000',
        street: 'אלנבי',
        streetNumber: '3',
      }),
    ).toEqual({ street: 'אלנבי', streetNumber: '3' });
  });

  it('resets street + number when the city id changes to a different city', () => {
    expect(
      applyAddressResetOnCityChange({
        prevCityId: '5000',
        nextCityId: '3000',
        street: 'אלנבי',
        streetNumber: '3',
      }),
    ).toEqual({ street: '', streetNumber: '' });
  });

  it('resets street + number when the city is cleared (next = null)', () => {
    expect(
      applyAddressResetOnCityChange({
        prevCityId: '5000',
        nextCityId: null,
        street: 'אלנבי',
        streetNumber: '3',
      }),
    ).toEqual({ street: '', streetNumber: '' });
  });

  it('resets street + number when going from no-city to a city', () => {
    // Should not happen in practice (street can't be set without a city), but
    // the helper still resets — guarantees no stale state survives a transition.
    expect(
      applyAddressResetOnCityChange({
        prevCityId: null,
        nextCityId: '5000',
        street: 'אלנבי (stale)',
        streetNumber: '99',
      }),
    ).toEqual({ street: '', streetNumber: '' });
  });

  it('treats undefined and null as the same "no city" state (idempotent)', () => {
    expect(
      applyAddressResetOnCityChange({
        prevCityId: undefined,
        nextCityId: null,
        street: 'אלנבי',
        streetNumber: '3',
      }),
    ).toEqual({ street: 'אלנבי', streetNumber: '3' });

    expect(
      applyAddressResetOnCityChange({
        prevCityId: null,
        nextCityId: undefined,
        street: 'אלנבי',
        streetNumber: '3',
      }),
    ).toEqual({ street: 'אלנבי', streetNumber: '3' });
  });

  it('keeps the street empty when it was already empty (no spurious reset)', () => {
    expect(
      applyAddressResetOnCityChange({
        prevCityId: '5000',
        nextCityId: '5000',
        street: '',
        streetNumber: '',
      }),
    ).toEqual({ street: '', streetNumber: '' });
  });
});
