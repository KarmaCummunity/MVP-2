import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  supabaseClearBasicInfoSkipped,
  supabaseMarkBasicInfoSkipped,
  supabaseSetBasicInfo,
} from '../onboardingSupabase';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Companion to onboardingSupabase.test.ts — covers the three update
// functions in their own file so each test file stays under the 200-LOC
// architecture cap.

interface UpdateCall {
  table: string;
  row: unknown;
  eqCol: string;
  eqVal: unknown;
}

function makeFakeClient(opts: {
  updateError?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: UpdateCall[] } {
  const calls: UpdateCall[] = [];
  const client = {
    from: (table: string) => ({
      update: (row: unknown) => ({
        eq: async (col: string, val: unknown) => {
          calls.push({ table, row, eqCol: col, eqVal: val });
          return { error: opts.updateError ?? null };
        },
      }),
    }),
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('supabaseMarkBasicInfoSkipped', () => {
  it('updates users.basic_info_skipped to true filtered by user_id', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseMarkBasicInfoSkipped(client, 'u_me');

    expect(calls).toEqual([
      {
        table: 'users',
        row: { basic_info_skipped: true },
        eqCol: 'user_id',
        eqVal: 'u_me',
      },
    ]);
  });

  it('throws with prefixed message on update error', async () => {
    const { client } = makeFakeClient({ updateError: { message: 'rls denied' } });

    await expect(supabaseMarkBasicInfoSkipped(client, 'u_me')).rejects.toThrow(
      'markBasicInfoSkipped: rls denied',
    );
  });
});

describe('supabaseClearBasicInfoSkipped', () => {
  it('updates users.basic_info_skipped to false filtered by user_id', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseClearBasicInfoSkipped(client, 'u_me');

    expect(calls[0]).toEqual({
      table: 'users',
      row: { basic_info_skipped: false },
      eqCol: 'user_id',
      eqVal: 'u_me',
    });
  });

  it('throws with prefixed message on update error', async () => {
    const { client } = makeFakeClient({ updateError: { message: 'oops' } });

    await expect(supabaseClearBasicInfoSkipped(client, 'u_me')).rejects.toThrow(
      'clearBasicInfoSkipped: oops',
    );
  });
});

describe('supabaseSetBasicInfo', () => {
  it('updates display_name + city + city_name and resets basic_info_skipped', async () => {
    const { client, calls } = makeFakeClient({});

    await supabaseSetBasicInfo(client, 'u_me', {
      displayName: 'Alice',
      city: 'IL-001',
      cityName: 'Tel Aviv',
    });

    expect(calls[0]).toEqual({
      table: 'users',
      row: {
        display_name: 'Alice',
        city: 'IL-001',
        city_name: 'Tel Aviv',
        basic_info_skipped: false,
      },
      eqCol: 'user_id',
      eqVal: 'u_me',
    });
  });

  it('throws with prefixed message on update error', async () => {
    const { client } = makeFakeClient({ updateError: { message: 'check failed' } });

    await expect(
      supabaseSetBasicInfo(client, 'u_me', {
        displayName: 'A',
        city: 'C',
        cityName: 'CN',
      }),
    ).rejects.toThrow('setBasicInfo: check failed');
  });
});
