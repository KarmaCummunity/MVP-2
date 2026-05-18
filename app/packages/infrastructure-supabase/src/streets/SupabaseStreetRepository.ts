// ─────────────────────────────────────────────
// SupabaseStreetRepository — adapter for IStreetRepository.
// Reads from `public.streets` (publicly readable per migration 0097).
//
// 5000-row cap covers the largest city (Jerusalem: 4384 streets) with margin
// and bypasses the Supabase JS client's 1000-row default cap.
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IStreetRepository } from '@kc/application';
import type { Street } from '@kc/domain';

interface Row {
  city_id: string;
  street_id: number;
  name_he: string;
}

export class SupabaseStreetRepository implements IStreetRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByCity(cityId: string): Promise<Street[]> {
    const { data, error } = await this.client
      .from('streets')
      .select('city_id, street_id, name_he')
      .eq('city_id', cityId)
      .order('name_he', { ascending: true })
      .limit(5000);
    if (error) throw new Error(`listByCity streets: ${error.message}`);
    const rows = (data ?? []) as Row[];
    return rows.map((r) => ({
      cityId: r.city_id,
      streetId: r.street_id,
      nameHe: r.name_he,
    }));
  }
}
