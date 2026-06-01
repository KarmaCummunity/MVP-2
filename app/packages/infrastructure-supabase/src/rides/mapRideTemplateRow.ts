// FR-RIDE-021 — snake_case DB row → domain camelCase RideTemplate.
import type { RideTemplate, RideTemplateStatus } from '@kc/domain';

type Row = {
  template_id: string;
  owner_id: string;
  mode: string;
  origin_city_id: string;
  dest_city_id: string;
  origin_street: string;
  origin_street_number: string | null;
  dest_street: string;
  dest_street_number: string | null;
  depart_time: string;
  weekday_mask: number;
  seats_available: number | null;
  description: string | null;
  visibility: string;
  status: string;
  lookahead_days: number;
  created_at: string;
  updated_at: string;
};

export function mapRideTemplateRow(row: Row): RideTemplate {
  return {
    templateId: row.template_id,
    ownerId: row.owner_id,
    mode: row.mode as RideTemplate['mode'],
    originCityId: row.origin_city_id,
    destCityId: row.dest_city_id,
    originStreet: row.origin_street,
    originStreetNumber: row.origin_street_number,
    destStreet: row.dest_street,
    destStreetNumber: row.dest_street_number,
    departTime: row.depart_time,
    weekdayMask: row.weekday_mask,
    seatsAvailable: row.seats_available,
    description: row.description,
    visibility: row.visibility as RideTemplate['visibility'],
    status: row.status as RideTemplateStatus,
    lookaheadDays: row.lookahead_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
