import type { RideListingRow } from '@kc/application';
import type {
  RideCargoTypeSlug,
  RideGenderRequirement,
  RidePaymentModel,
} from '@kc/domain';

type RideRow = {
  ride_id: string;
  owner_id: string;
  mode: string;
  origin_city_id: string;
  dest_city_id: string;
  origin_street: string;
  origin_street_number: string | null;
  dest_street: string;
  dest_street_number: string | null;
  departs_at: string;
  seats_available: number | null;
  description: string | null;
  title: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  // FR-RIDE-026..029 — V3.0 advanced columns. Optional in row shape because
  // pre-V3.0 cached rows + the snapshot in older fakes may omit them.
  cargo_enabled?: boolean | null;
  cargo_max_volume_l?: number | null;
  cargo_max_weight_kg?: number | null;
  cargo_allowed_types?: string[] | null;
  food_shipping_enabled?: boolean | null;
  food_max_kg?: number | null;
  food_chilled?: boolean | null;
  payment_model?: string | null;
  payment_amount_ils?: number | null;
  req_gender?: string | null;
  req_smoking_allowed?: boolean | null;
  req_pets_allowed?: boolean | null;
  req_verified_only?: boolean | null;
  // FR-RIDE-031 — active lifecycle.
  started_at?: string | null;
  arrived_at?: string | null;
  arrive_reason?: string | null;
};

export function mapRideRow(
  row: RideRow,
  originCityName: string,
  destCityName: string,
): RideListingRow {
  return {
    rideId: row.ride_id,
    ownerId: row.owner_id,
    mode: row.mode as RideListingRow['mode'],
    originCityId: row.origin_city_id,
    destCityId: row.dest_city_id,
    originCityName,
    destCityName,
    originStreet: row.origin_street,
    originStreetNumber: row.origin_street_number,
    destStreet: row.dest_street,
    destStreetNumber: row.dest_street_number,
    departsAt: row.departs_at,
    seatsAvailable: row.seats_available,
    description: row.description,
    title: row.title,
    status: row.status as RideListingRow['status'],
    visibility: row.visibility as RideListingRow['visibility'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // FR-RIDE-026 — cargo (defaults preserve V2.0 row shape).
    cargoEnabled: row.cargo_enabled ?? false,
    cargoMaxVolumeL: row.cargo_max_volume_l ?? null,
    cargoMaxWeightKg: row.cargo_max_weight_kg ?? null,
    cargoAllowedTypes: row.cargo_allowed_types
      ? (row.cargo_allowed_types as ReadonlyArray<RideCargoTypeSlug>)
      : null,
    // FR-RIDE-027 — food.
    foodShippingEnabled: row.food_shipping_enabled ?? false,
    foodMaxKg: row.food_max_kg ?? null,
    foodChilled: row.food_chilled ?? null,
    // FR-RIDE-028 — payment.
    paymentModel: (row.payment_model ?? 'free') as RidePaymentModel,
    paymentAmountIls: row.payment_amount_ils ?? null,
    // FR-RIDE-029 — requirements.
    reqGender: (row.req_gender ?? 'any') as RideGenderRequirement,
    reqSmokingAllowed: row.req_smoking_allowed ?? false,
    reqPetsAllowed: row.req_pets_allowed ?? false,
    reqVerifiedOnly: row.req_verified_only ?? false,
    // FR-RIDE-031 — active lifecycle.
    startedAt: row.started_at ?? null,
    arrivedAt: row.arrived_at ?? null,
    arriveReason: (row.arrive_reason ?? null) as RideListingRow['arriveReason'],
  };
}
