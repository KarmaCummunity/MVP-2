import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  supabaseSetProfileAddressLines,
  supabaseUpdateEditableProfile,
} from '../editableProfileSupabase';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion to editableProfileSupabase.test.ts — covers the update
// functions in their own file so each test file stays under the 200-LOC
// architecture cap.

interface UpdateCall {
  table: string;
  row: unknown;
  eqCol: string;
  eqVal: unknown;
}

function makeFakeClient(opts: {
  error?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: UpdateCall[] } {
  const calls: UpdateCall[] = [];
  const client = {
    from: (table: string) => ({
      update: (row: unknown) => ({
        eq: async (col: string, val: unknown) => {
          calls.push({ table, row, eqCol: col, eqVal: val });
          return { error: opts.error ?? null };
        },
      }),
    }),
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('supabaseSetProfileAddressLines', () => {
  it('updates profile_street + profile_street_number with both values', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseSetProfileAddressLines(client, 'u_me', 'Allenby', '12');

    expect(calls).toEqual([
      {
        table: 'users',
        row: { profile_street: 'Allenby', profile_street_number: '12' },
        eqCol: 'user_id',
        eqVal: 'u_me',
      },
    ]);
  });

  it('forwards null/null verbatim (clear-the-address case)', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseSetProfileAddressLines(client, 'u_me', null, null);

    expect(calls[0]?.row).toEqual({
      profile_street: null,
      profile_street_number: null,
    });
  });

  it('throws with prefixed "setProfileAddressLines: " message on update error', async () => {
    const { client } = makeFakeClient({ error: { message: 'rls denied' } });

    await expect(
      supabaseSetProfileAddressLines(client, 'u_me', 'X', '1'),
    ).rejects.toThrow('setProfileAddressLines: rls denied');
  });
});

describe('supabaseUpdateEditableProfile', () => {
  it('updates a single field when only that field is in the patch', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseUpdateEditableProfile(client, 'u_me', { displayName: 'Alice' });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.row).toEqual({ display_name: 'Alice' });
    expect(calls[0]?.eqCol).toBe('user_id');
    expect(calls[0]?.eqVal).toBe('u_me');
  });

  it('emits one atomic UPDATE for a multi-field patch (audit §3.5)', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseUpdateEditableProfile(client, 'u_me', {
      displayName: 'Alice',
      city: 'IL-001',
      cityName: 'Tel Aviv',
      profileStreet: 'Allenby',
      profileStreetNumber: '12',
      biography: 'bio',
      avatarUrl: 'https://x.test/u.jpg',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.row).toEqual({
      display_name: 'Alice',
      city: 'IL-001',
      city_name: 'Tel Aviv',
      profile_street: 'Allenby',
      profile_street_number: '12',
      biography: 'bio',
      avatar_url: 'https://x.test/u.jpg',
    });
  });

  it('preserves explicit null in nullable fields (clear-the-value semantic)', async () => {
    // The patch distinguishes "skip this field" (key absent) from "clear
    // this field" (key present with value null). Explicit null must be
    // passed through to the DB.
    const { client, calls } = makeFakeClient({});

    await supabaseUpdateEditableProfile(client, 'u_me', {
      biography: null,
      avatarUrl: null,
      profileStreet: null,
    });

    expect(calls[0]?.row).toEqual({
      biography: null,
      avatar_url: null,
      profile_street: null,
    });
  });

  it('returns without calling the DB when the patch is empty', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseUpdateEditableProfile(client, 'u_me', {});

    expect(calls).toHaveLength(0);
  });

  it('returns without calling the DB when every patch field is undefined', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseUpdateEditableProfile(client, 'u_me', {
      displayName: undefined,
      city: undefined,
      biography: undefined,
    });

    expect(calls).toHaveLength(0);
  });

  it('throws with prefixed "updateEditableProfile: " message on update error', async () => {
    const { client } = makeFakeClient({ error: { message: 'check violated' } });

    await expect(
      supabaseUpdateEditableProfile(client, 'u_me', { displayName: 'A' }),
    ).rejects.toThrow('updateEditableProfile: check violated');
  });
});
