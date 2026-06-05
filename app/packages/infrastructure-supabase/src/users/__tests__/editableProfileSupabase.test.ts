import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseGetEditableProfile } from '../editableProfileSupabase';
import type { UsersSelfPrivateSlice } from '../usersSelfPrivateFields';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion file editableProfileSupabase.updates.test.ts covers
// supabaseSetProfileAddressLines + supabaseUpdateEditableProfile.

interface SelectCall {
  table: string;
  selected: string;
  eqCol: string;
  eqVal: unknown;
}

const PRIVATE_SLICE: UsersSelfPrivateSlice = {
  profile_street: 'Allenby',
  profile_street_number: '12',
  contact_phone: '050-1234567',
  notification_preferences: { critical: true, social: true },
  is_super_admin: false,
  active_posts_count_internal: 0,
};

function makeFakeClient(opts: {
  data?: unknown;
  error?: { message: string } | null;
  privateSlice?: UsersSelfPrivateSlice | null;
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
    rpc: async (fn: string) => {
      if (fn === 'users_get_self_private_fields') {
        return { data: opts.privateSlice ?? PRIVATE_SLICE, error: null };
      }
      return { data: null, error: null };
    },
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

const PUBLIC_ROW = {
  display_name: 'Alice',
  city: 'IL-001',
  city_name: 'Tel Aviv',
  biography: 'I give books.',
  avatar_url: 'https://cdn.example.com/u_1.jpg',
};

describe('supabaseGetEditableProfile', () => {
  it('selects public editable columns and loads PII via users_get_self_private_fields', async () => {
    const { client, calls } = makeFakeClient({ data: PUBLIC_ROW });

    await supabaseGetEditableProfile(client, 'u_me');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      table: 'users',
      selected: 'display_name, city, city_name, biography, avatar_url',
      eqCol: 'user_id',
      eqVal: 'u_me',
    });
  });

  it('maps snake_case columns to the camelCase DTO', async () => {
    const { client } = makeFakeClient({ data: PUBLIC_ROW });

    const out = await supabaseGetEditableProfile(client, 'u_me');

    expect(out).toEqual({
      displayName: 'Alice',
      city: 'IL-001',
      cityName: 'Tel Aviv',
      profileStreet: 'Allenby',
      profileStreetNumber: '12',
      contactPhone: '050-1234567',
      biography: 'I give books.',
      avatarUrl: 'https://cdn.example.com/u_1.jpg',
    });
  });

  it('preserves null for the five nullable columns', async () => {
    const { client } = makeFakeClient({
      data: {
        ...PUBLIC_ROW,
        biography: null,
        avatar_url: null,
      },
      privateSlice: {
        ...PRIVATE_SLICE,
        profile_street: null,
        profile_street_number: null,
        contact_phone: null,
      },
    });

    const out = await supabaseGetEditableProfile(client, 'u_me');

    expect(out.profileStreet).toBeNull();
    expect(out.profileStreetNumber).toBeNull();
    expect(out.contactPhone).toBeNull();
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
