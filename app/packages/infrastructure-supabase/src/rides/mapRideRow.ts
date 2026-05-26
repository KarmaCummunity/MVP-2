import type { RideListingRow } from '@kc/application';

type RideRow = {
  ride_id: string;
  owner_id: string;
  mode: string;
  origin_city_id: string;
  dest_city_id: string;
  departs_at: string;
  seats_available: number | null;
  description: string | null;
  title: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
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
    departsAt: row.departs_at,
    seatsAvailable: row.seats_available,
    description: row.description,
    title: row.title,
    status: row.status as RideListingRow['status'],
    visibility: row.visibility as RideListingRow['visibility'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
