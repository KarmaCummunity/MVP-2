import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCityRepository } from '../SupabaseCityRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FromCall {
  table: string;
  select?: string;
  order?: { column: string; ascending: boolean };
}

function makeFakeClient(opts: {
  data?: unknown;
  error?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: FromCall[] } {
  const calls: FromCall[] = [];
  const client = {
    from: (table: string) => {
      const call: FromCall = { table };
      calls.push(call);
      const chain = {
        select: (cols: string) => {
          call.select = cols;
          return chain;
        },
        order: (column: string, opt: { ascending: boolean }) => {
          call.order = { column, ascending: opt.ascending };
          return Promise.resolve({
            data: opts.data ?? null,
            error: opts.error ?? null,
          });
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('SupabaseCityRepository', () => {
  describe('listAll', () => {
    it('queries the cities table with city_id, name_he, name_en sorted by name_he asc', async () => {
      const { client, calls } = makeFakeClient({ data: [] });
      const repo = new SupabaseCityRepository(client);

      await repo.listAll();

      expect(calls).toHaveLength(1);
      expect(calls[0]?.table).toBe('cities');
      expect(calls[0]?.select).toBe('city_id, name_he, name_en');
      expect(calls[0]?.order).toEqual({ column: 'name_he', ascending: true });
    });

    it('maps rows from snake_case to camelCase City entities', async () => {
      const { client } = makeFakeClient({
        data: [
          { city_id: 'IL-001', name_he: 'תל אביב', name_en: 'Tel Aviv' },
          { city_id: 'IL-002', name_he: 'ירושלים', name_en: 'Jerusalem' },
        ],
      });
      const repo = new SupabaseCityRepository(client);

      const out = await repo.listAll();

      expect(out).toEqual([
        { cityId: 'IL-001', nameHe: 'תל אביב', nameEn: 'Tel Aviv' },
        { cityId: 'IL-002', nameHe: 'ירושלים', nameEn: 'Jerusalem' },
      ]);
    });

    it('preserves the order returned by the database', async () => {
      // The repo does not re-sort client-side — it trusts the ORDER BY in
      // the query. Verifies the mapper is a stable map(), not a re-sort.
      const { client } = makeFakeClient({
        data: [
          { city_id: 'IL-002', name_he: 'באר שבע', name_en: 'Beer Sheva' },
          { city_id: 'IL-001', name_he: 'אילת', name_en: 'Eilat' },
        ],
      });
      const repo = new SupabaseCityRepository(client);

      const out = await repo.listAll();

      expect(out.map((c) => c.cityId)).toEqual(['IL-002', 'IL-001']);
    });

    it('returns [] when the response data is an empty array', async () => {
      const { client } = makeFakeClient({ data: [] });
      const repo = new SupabaseCityRepository(client);

      expect(await repo.listAll()).toEqual([]);
    });

    it('returns [] when the response data is null (defensive coalesce)', async () => {
      // Supabase contracts: data is null when no rows match, but some
      // transport edge cases also flip data to null. The mapper guards
      // against this so callers never see a TypeError.
      const { client } = makeFakeClient({ data: null });
      const repo = new SupabaseCityRepository(client);

      expect(await repo.listAll()).toEqual([]);
    });

    it('throws with a prefixed "listAll cities: " message when the response carries an error', async () => {
      const { client } = makeFakeClient({
        data: null,
        error: { message: 'connection reset by peer' },
      });
      const repo = new SupabaseCityRepository(client);

      await expect(repo.listAll()).rejects.toThrow('listAll cities: connection reset by peer');
    });

    it('throws even when the error object carries an empty message', async () => {
      const { client } = makeFakeClient({
        data: null,
        error: { message: '' },
      });
      const repo = new SupabaseCityRepository(client);

      await expect(repo.listAll()).rejects.toThrow('listAll cities: ');
    });
  });
});
