import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStreetRepository } from '../SupabaseStreetRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FromCall {
  table: string;
  select?: string;
  eq?: { column: string; value: unknown };
  order?: { column: string; ascending: boolean };
  limit?: number;
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
        eq: (column: string, value: unknown) => {
          call.eq = { column, value };
          return chain;
        },
        order: (column: string, opt: { ascending: boolean }) => {
          call.order = { column, ascending: opt.ascending };
          return chain;
        },
        limit: (n: number) => {
          call.limit = n;
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

describe('SupabaseStreetRepository', () => {
  describe('listByCity', () => {
    it('queries streets for the given city_id, sorted by name_he asc, with a >= 5000 row cap', async () => {
      // 5000 covers Jerusalem (4384 rows) with margin. No silent truncation
      // even for the largest city.
      const { client, calls } = makeFakeClient({ data: [] });
      const repo = new SupabaseStreetRepository(client);

      await repo.listByCity('5000');

      expect(calls).toHaveLength(1);
      expect(calls[0]?.table).toBe('streets');
      expect(calls[0]?.select).toBe('city_id, street_id, name_he');
      expect(calls[0]?.eq).toEqual({ column: 'city_id', value: '5000' });
      expect(calls[0]?.order).toEqual({ column: 'name_he', ascending: true });
      expect(calls[0]?.limit).toBeDefined();
      expect(calls[0]!.limit!).toBeGreaterThanOrEqual(5000);
    });

    it('maps rows from snake_case to camelCase Street entities', async () => {
      const { client } = makeFakeClient({
        data: [
          { city_id: '5000', street_id: 123, name_he: 'אלנבי' },
          { city_id: '5000', street_id: 456, name_he: 'בן יהודה' },
        ],
      });
      const repo = new SupabaseStreetRepository(client);

      const out = await repo.listByCity('5000');

      expect(out).toEqual([
        { cityId: '5000', streetId: 123, nameHe: 'אלנבי' },
        { cityId: '5000', streetId: 456, nameHe: 'בן יהודה' },
      ]);
    });

    it('returns [] when the city has no streets in the table', async () => {
      const { client } = makeFakeClient({ data: [] });
      const repo = new SupabaseStreetRepository(client);
      expect(await repo.listByCity('3729')).toEqual([]);
    });

    it('returns [] when the response data is null (defensive coalesce)', async () => {
      const { client } = makeFakeClient({ data: null });
      const repo = new SupabaseStreetRepository(client);
      expect(await repo.listByCity('5000')).toEqual([]);
    });

    it('preserves the order returned by the database (no client-side re-sort)', async () => {
      // The repo trusts the ORDER BY in the query, so the mapper must be a
      // stable map(), not a re-sort.
      const { client } = makeFakeClient({
        data: [
          { city_id: '5000', street_id: 2, name_he: 'ב' },
          { city_id: '5000', street_id: 1, name_he: 'א' },
        ],
      });
      const repo = new SupabaseStreetRepository(client);

      const out = await repo.listByCity('5000');

      expect(out.map((s) => s.streetId)).toEqual([2, 1]);
    });

    it('throws with a prefixed "listByCity streets: " message when the response carries an error', async () => {
      const { client } = makeFakeClient({
        data: null,
        error: { message: 'connection reset by peer' },
      });
      const repo = new SupabaseStreetRepository(client);

      await expect(repo.listByCity('5000')).rejects.toThrow(
        'listByCity streets: connection reset by peer',
      );
    });

    it('throws even when the error object carries an empty message', async () => {
      const { client } = makeFakeClient({
        data: null,
        error: { message: '' },
      });
      const repo = new SupabaseStreetRepository(client);

      await expect(repo.listByCity('5000')).rejects.toThrow('listByCity streets: ');
    });

    it('passes the cityId through verbatim (no implicit casting / trimming)', async () => {
      const { client, calls } = makeFakeClient({ data: [] });
      const repo = new SupabaseStreetRepository(client);
      await repo.listByCity('  9999  ');
      expect(calls[0]?.eq).toEqual({ column: 'city_id', value: '  9999  ' });
    });
  });
});
