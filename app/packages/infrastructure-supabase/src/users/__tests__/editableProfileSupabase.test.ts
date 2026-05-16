import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseGetEditableProfile } from '../editableProfileSupabase';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion file editableProfileSupabase.updates.test.ts covers
// supabaseSetProfileAddressLines + supabaseUpdateEditableProfile.

interface SelectCall {
  table: string;
  selected: string;
  eqCol: string;
  eqVal: unknown;
}

function makeFakeClient(opts: {
  data?: unknown;
  error?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: SelectCall[] } {
  const calls: SelectCall[] = [];
  const client = {
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, val: unknown) => ({
          single: async () => {
            calls.push({ table, selected: cols, eqCol: col, eqVal: val });
            return { data: opts.data ?? null, error: opts.error ?? null };
          },
        }),
      }),
    }),
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

const FULL_ROW = {
  display_name: 'Alice',
  city: 'IL-001',
  city_name: 'Tel Aviv',
  profile_street: 'Allenby',
  profile_street_number: '12',
  biography: 'I give books.',
  avatar_url: 'https://cdn.example.com/u_1.jpg',
};

describe('supabaseGetEditableProfile', () => {
  it('selects exactly the seven editable columns from users for the given user_id (single-row)', async () => {
    const { client, calls } = makeFakeClient({ data: FULL_ROW });

    await supabaseGetEditableProfile(client, 'u_me');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      table: 'users',
      selected:
        'display_name, city, city_name, profile_street, profile_street_number, biography, avatar_url',
      eqCol: 'user_id',
      eqVal: 'u_me',
    });
  });

  it('maps snake_case columns to the camelCase DTO', async () => {
    const { client } = makeFakeClient({ data: FULL_ROW });

    const out = await supabaseGetEditableProfile(client, 'u_me');

    expect(out).toEqual({
      displayName: 'Alice',
      city: 'IL-001',
      cityName: 'Tel Aviv',
      profileStreet: 'Allenby',
      profileStreetNumber: '12',
      biography: 'I give books.',
      avatarUrl: 'https://cdn.example.com/u_1.jpg',
    });
  });

  it('preserves null for the four nullable columns', async () => {
    const { client } = makeFakeClient({
      data: {
        ...FULL_ROW,
        profile_street: null,
        profile_street_number: null,
        biography: null,
        avatar_url: null,
      },
    });

    const out = await supabaseGetEditableProfile(client, 'u_me');

    expect(out.profileStreet).toBeNull();
    expect(out.profileStreetNumber).toBeNull();
    expect(out.biography).toBeNull();
    expect(out.avatarUrl).toBeNull();
  });

  it('throws "no row" when data is null (user missing or RLS-hidden)', async () => {
    const { client } = makeFakeClient({ data: null });

    await expect(supabaseGetEditableProfile(client, 'u_me')).rejects.toThrow(
      'getEditableProfile: no row',
    );
  });

  it('throws with a prefixed "getEditableProfile: " message on query error', async () => {
    const { client } = makeFakeClient({ error: { message: 'transport error' } });

    await expect(supabaseGetEditableProfile(client, 'u_me')).rejects.toThrow(
      'getEditableProfile: transport error',
    );
  });
});
