import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseGetOnboardingBootstrap } from '../onboardingSupabase';

// Companion file onboardingSupabase.updates.test.ts covers the three
// update functions (mark/clear/set basic info). Split so each file stays
// under the 200-LOC arch cap.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SelectCall {
  kind: 'select';
  table: string;
  selected: string;
  eqCol: string;
  eqVal: unknown;
}

function makeFakeClient(opts: {
  selectData?: unknown;
  selectError?: { message: string } | null;
}): { client: SupabaseClient<any>; calls: SelectCall[] } {
  const calls: SelectCall[] = [];
  const client = {
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (col: string, val: unknown) => ({
          single: async () => {
            calls.push({ kind: 'select', table, selected: cols, eqCol: col, eqVal: val });
            return { data: opts.selectData ?? null, error: opts.selectError ?? null };
          },
        }),
      }),
    }),
  } as unknown as SupabaseClient<any>;
  return { client, calls };
}

describe('supabaseGetOnboardingBootstrap', () => {
  it('selects onboarding_state + basic_info_skipped for the user, single-row', async () => {
    const { client, calls } = makeFakeClient({
      selectData: { onboarding_state: 'completed', basic_info_skipped: false },
    });

    await supabaseGetOnboardingBootstrap(client, 'u_me');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      kind: 'select',
      table: 'users',
      selected: 'onboarding_state, basic_info_skipped',
      eqCol: 'user_id',
      eqVal: 'u_me',
    });
  });

  it('returns { state, basicInfoSkipped: true } when the row says skipped', async () => {
    const { client } = makeFakeClient({
      selectData: { onboarding_state: 'pending_basic_info', basic_info_skipped: true },
    });

    const out = await supabaseGetOnboardingBootstrap(client, 'u_me');

    expect(out).toEqual({ state: 'pending_basic_info', basicInfoSkipped: true });
  });

  it('returns basicInfoSkipped === false when the column is strictly false', async () => {
    const { client } = makeFakeClient({
      selectData: { onboarding_state: 'completed', basic_info_skipped: false },
    });

    const out = await supabaseGetOnboardingBootstrap(client, 'u_me');

    expect(out.basicInfoSkipped).toBe(false);
  });

  it('coerces a null basic_info_skipped column to false (=== true check)', async () => {
    // The bootstrap returns basicInfoSkipped only when the column is strictly
    // `true`. Null / undefined / any other falsy value resolves to false so
    // the FE never sees a tri-state.
    const { client } = makeFakeClient({
      selectData: { onboarding_state: 'completed', basic_info_skipped: null },
    });

    const out = await supabaseGetOnboardingBootstrap(client, 'u_me');

    expect(out.basicInfoSkipped).toBe(false);
  });

  it('throws "no row" when data is null', async () => {
    const { client } = makeFakeClient({ selectData: null });

    await expect(supabaseGetOnboardingBootstrap(client, 'u_me')).rejects.toThrow(
      'getOnboardingBootstrap: no row',
    );
  });

  it('throws "no row" when the row is present but onboarding_state is falsy', async () => {
    const { client } = makeFakeClient({
      selectData: { onboarding_state: null, basic_info_skipped: false },
    });

    await expect(supabaseGetOnboardingBootstrap(client, 'u_me')).rejects.toThrow(
      'getOnboardingBootstrap: no row',
    );
  });

  it('throws with prefixed message on query error', async () => {
    const { client } = makeFakeClient({
      selectError: { message: 'transport error' },
    });

    await expect(supabaseGetOnboardingBootstrap(client, 'u_me')).rejects.toThrow(
      'getOnboardingBootstrap: transport error',
    );
  });
});

