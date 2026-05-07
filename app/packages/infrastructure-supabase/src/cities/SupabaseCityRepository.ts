// ─────────────────────────────────────────────
// SupabaseCityRepository — adapter for ICityRepository.
// Reads from `public.cities` (publicly readable per migration 0001 §6.1).
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ICityRepository } from '@kc/application';
import type { City } from '@kc/domain';

interface Row {
  city_id: string;
  name_he: string;
  name_en: string;
}

export class SupabaseCityRepository implements ICityRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listAll(): Promise<City[]> {
    const { data, error } = await this.client
      .from('cities')
      .select('city_id, name_he, name_en')
      .order('name_he', { ascending: true });
    if (error) throw new Error(`listAll cities: ${error.message}`);
    const rows = (data ?? []) as Row[];
    return rows.map((r) => ({
      cityId: r.city_id,
      nameHe: r.name_he,
      nameEn: r.name_en,
    }));
  }
}
