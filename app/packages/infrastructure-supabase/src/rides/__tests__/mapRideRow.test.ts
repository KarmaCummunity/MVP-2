import { describe, expect, it } from 'vitest';
import { mapRideRow } from '../mapRideRow';

describe('mapRideRow', () => {
  it('maps snake_case row to RideListingRow', () => {
    const out = mapRideRow(
      {
        ride_id: 'r1',
        owner_id: 'u1',
        mode: 'offer',
        origin_city_id: '5000',
        dest_city_id: '4000',
        origin_street: 'רחוב א',
        origin_street_number: '12',
        dest_street: 'רחוב ב',
        dest_street_number: null,
        departs_at: '2026-06-01T10:00:00Z',
        seats_available: 3,
        description: 'notes',
        title: 'Route',
        status: 'open',
        visibility: 'Public',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
      'תל אביב',
      'חיפה',
    );

    expect(out).toEqual({
      rideId: 'r1',
      ownerId: 'u1',
      mode: 'offer',
      originCityId: '5000',
      destCityId: '4000',
      originCityName: 'תל אביב',
      destCityName: 'חיפה',
      originStreet: 'רחוב א',
      originStreetNumber: '12',
      destStreet: 'רחוב ב',
      destStreetNumber: null,
      departsAt: '2026-06-01T10:00:00Z',
      seatsAvailable: 3,
      description: 'notes',
      title: 'Route',
      status: 'open',
      visibility: 'Public',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
      // FR-RIDE-026..029 — V3.0 defaults when the source row omits the columns.
      cargoEnabled: false,
      cargoMaxVolumeL: null,
      cargoMaxWeightKg: null,
      cargoAllowedTypes: null,
      foodShippingEnabled: false,
      foodMaxKg: null,
      foodChilled: null,
      paymentModel: 'free',
      paymentAmountIls: null,
      reqGender: 'any',
      reqSmokingAllowed: false,
      reqPetsAllowed: false,
      reqVerifiedOnly: false,
    });
  });

  it('maps V3.0 advanced columns when present', () => {
    const out = mapRideRow(
      {
        ride_id: 'r2',
        owner_id: 'u1',
        mode: 'offer',
        origin_city_id: '5000',
        dest_city_id: '4000',
        origin_street: 'X',
        origin_street_number: null,
        dest_street: 'Y',
        dest_street_number: null,
        departs_at: '2026-06-02T10:00:00Z',
        seats_available: 2,
        description: null,
        title: 'X→Y',
        status: 'open',
        visibility: 'Public',
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
        cargo_enabled: true,
        cargo_max_volume_l: 200,
        cargo_max_weight_kg: 60,
        cargo_allowed_types: ['furniture', 'small_packages'],
        food_shipping_enabled: false,
        food_max_kg: null,
        food_chilled: null,
        payment_model: 'expense_share',
        payment_amount_ils: 45,
        req_gender: 'women_only',
        req_smoking_allowed: false,
        req_pets_allowed: true,
        req_verified_only: true,
      },
      'X',
      'Y',
    );
    expect(out.cargoEnabled).toBe(true);
    expect(out.cargoAllowedTypes).toEqual(['furniture', 'small_packages']);
    expect(out.paymentModel).toBe('expense_share');
    expect(out.paymentAmountIls).toBe(45);
    expect(out.reqGender).toBe('women_only');
    expect(out.reqPetsAllowed).toBe(true);
    expect(out.reqVerifiedOnly).toBe(true);
  });
});
