import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateRideListingRepoInput,
  FindRideMatchesInput,
  IRideListingRepository,
  RideListingRow,
  SearchRideListingsInput,
} from '@kc/application';
import type { Database } from '../database.types';
import { mapRideRow } from './mapRideRow';

type RideRow = Database['public']['Tables']['ride_listings']['Row'];

const RIDE_SELECT =
  '*, origin_city:cities!ride_listings_origin_city_id_fkey(name_he), dest_city:cities!ride_listings_dest_city_id_fkey(name_he)';

type RideRowWithCities = RideRow & {
  origin_city: { name_he: string } | null;
  dest_city: { name_he: string } | null;
};

function mapJoinedRow(row: RideRowWithCities): RideListingRow {
  return mapRideRow(
    row,
    row.origin_city?.name_he ?? '',
    row.dest_city?.name_he ?? '',
  );
}

export class SupabaseRideListingRepository implements IRideListingRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateRideListingRepoInput): Promise<RideListingRow> {
    const { data, error } = await this.client
      .from('ride_listings')
      .insert({
        owner_id: input.ownerId,
        mode: input.mode,
        origin_city_id: input.originCityId,
        dest_city_id: input.destCityId,
        origin_street: input.originStreet,
        origin_street_number: input.originStreetNumber,
        dest_street: input.destStreet,
        dest_street_number: input.destStreetNumber,
        departs_at: input.departsAt,
        seats_available: input.seatsAvailable,
        description: input.description,
        title: input.title,
        visibility: input.visibility,
      })
      .select(RIDE_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return mapJoinedRow(data as RideRowWithCities);
  }

  async getById(rideId: string, _viewerId: string): Promise<RideListingRow | null> {
    const { data, error } = await this.client
      .from('ride_listings')
      .select(RIDE_SELECT)
      .eq('ride_id', rideId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapJoinedRow(data as RideRowWithCities);
  }

  async search(input: SearchRideListingsInput): Promise<RideListingRow[]> {
    const { data, error } = await this.client.rpc('ride_listings_search', {
      p_query: input.query ?? undefined,
      p_origin_city_id: input.originCityId ?? undefined,
      p_dest_city_id: input.destCityId ?? undefined,
      p_mode: input.mode ?? undefined,
      p_depart_from: input.departFrom ?? undefined,
      p_depart_to: input.departTo ?? undefined,
      p_limit: input.limit ?? 30,
      p_cursor: input.cursor ?? undefined,
    });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as RideRow[];
    if (rows.length === 0) return [];

    const cityIds = [...new Set(rows.flatMap((r) => [r.origin_city_id, r.dest_city_id]))];
    const { data: cities, error: cityErr } = await this.client
      .from('cities')
      .select('city_id, name_he')
      .in('city_id', cityIds);
    if (cityErr) throw new Error(cityErr.message);
    const nameById = new Map((cities ?? []).map((c) => [c.city_id, c.name_he]));

    return rows.map((r) =>
      mapRideRow(
        r,
        nameById.get(r.origin_city_id) ?? '',
        nameById.get(r.dest_city_id) ?? '',
      ),
    );
  }

  async close(rideId: string, ownerId: string, status: 'closed' | 'cancelled'): Promise<void> {
    const { error } = await this.client
      .from('ride_listings')
      .update({ status })
      .eq('ride_id', rideId)
      .eq('owner_id', ownerId);
    if (error) throw new Error(error.message);
  }

  async findMatches(input: FindRideMatchesInput): Promise<RideListingRow[]> {
    const { data, error } = await this.client.rpc('ride_listings_find_matches', {
      p_ride_id: input.rideId,
      p_window_hours: input.windowHours ?? undefined,
      p_limit: input.limit ?? undefined,
    });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as RideRow[];
    if (rows.length === 0) return [];

    const cityIds = [...new Set(rows.flatMap((r) => [r.origin_city_id, r.dest_city_id]))];
    const { data: cities, error: cityErr } = await this.client
      .from('cities')
      .select('city_id, name_he')
      .in('city_id', cityIds);
    if (cityErr) throw new Error(cityErr.message);
    const nameById = new Map((cities ?? []).map((c) => [c.city_id, c.name_he]));

    return rows.map((r) =>
      mapRideRow(
        r,
        nameById.get(r.origin_city_id) ?? '',
        nameById.get(r.dest_city_id) ?? '',
      ),
    );
  }
}
