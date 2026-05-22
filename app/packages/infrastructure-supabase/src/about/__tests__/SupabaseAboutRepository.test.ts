import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAboutRepository } from '../SupabaseAboutRepository';

/* eslint-disable @typescript-eslint/no-explicit-any */

function makeFakeClient(rows: unknown[] | null, error: { message: string } | null = null) {
  const client = {
    from: () => ({
      select: async () => ({ data: rows, error }),
    }),
  } as unknown as SupabaseClient<any>;
  return client;
}

describe('SupabaseAboutRepository — listTeamMembers', () => {
  it('reads from about_team_profiles and maps rows to domain shape', async () => {
    const client = makeFakeClient([
      {
        role_key: 'founder',
        sort_order: 0,
        display_name: 'Nave',
        avatar_url: 'a.jpg',
        share_handle: 'nave',
      },
    ]);
    await expect(new SupabaseAboutRepository(client).listTeamMembers()).resolves.toEqual([
      {
        roleKey: 'founder',
        sortOrder: 0,
        displayName: 'Nave',
        avatarUrl: 'a.jpg',
        shareHandle: 'nave',
      },
    ]);
  });

  it('returns an empty array when the view has no rows', async () => {
    await expect(new SupabaseAboutRepository(makeFakeClient([])).listTeamMembers()).resolves.toEqual([]);
  });

  it('throws with a prefixed message on query error', async () => {
    await expect(
      new SupabaseAboutRepository(makeFakeClient(null, { message: 'rls denied' })).listTeamMembers(),
    ).rejects.toThrow('listTeamMembers: rls denied');
  });
});
