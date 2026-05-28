// FR-RIDE-021 / FR-RIDE-022 — port for recurring ride template persistence.
//
// Templates allow direct CRUD via RLS (owner-only on all five verbs), so the
// adapter calls the supabase client's from('ride_templates') APIs directly —
// no SECURITY DEFINER RPC layer.

import type { RideTemplate, RideTemplateStatus } from '@kc/domain';

export interface CreateRideTemplateInput {
  ownerId: string;
  mode: 'offer' | 'request';
  originCityId: string;
  destCityId: string;
  originStreet: string;
  originStreetNumber: string | null;
  destStreet: string;
  destStreetNumber: string | null;
  /** 'HH:MM' local time (24h). */
  departTime: string;
  /** Bitmask Sun=1..Sat=64. */
  weekdayMask: number;
  seatsAvailable: number | null;
  description: string | null;
  visibility: 'Public' | 'FollowersOnly' | 'OnlyMe';
  lookaheadDays: number;
}

export interface IRideTemplateRepository {
  create(input: CreateRideTemplateInput): Promise<RideTemplate>;
  getById(templateId: string): Promise<RideTemplate | null>;
  listForOwner(ownerId: string): Promise<readonly RideTemplate[]>;
  /** Owner pauses an active template (no future materialization). */
  setStatus(templateId: string, status: RideTemplateStatus): Promise<RideTemplate>;
  /**
   * Hard delete. Materialized historical ride_listings rows are preserved
   * because their FK is ON DELETE SET NULL.
   */
  delete(templateId: string): Promise<void>;
}
