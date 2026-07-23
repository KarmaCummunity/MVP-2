import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { GloweProfileRepository } from '../repositories/GloweProfileRepository';

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

function makeClient(row: Record<string, unknown> | null): SupabaseClient {
  const maybeSingle = vi.fn(async () => ({ data: row, error: null }));
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
  }));

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: USER_ID, email: 'u@test.com' } } })),
    },
    from,
    functions: { invoke: vi.fn() },
    storage: { from: vi.fn() },
  } as unknown as SupabaseClient;
}

describe('GloweProfileRepository', () => {
  it('getById queries glowe_profiles', async () => {
    const row = {
      id: USER_ID,
      display_name: 'Test',
      display_name_en: 'Test',
      email: 'u@test.com',
      profile_type: 'Individual',
      account_type: 'individual',
      onboarding_complete: true,
      approval_status: 'not_required',
    };
    const client = makeClient(row);
    const repo = new GloweProfileRepository(client);

    const profile = await repo.getById(USER_ID);

    expect(client.from).toHaveBeenCalledWith('glowe_profiles');
    expect(profile?.name).toBe('Test');
  });

  it('getMine returns null when unauthenticated', async () => {
    const client = {
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    } as unknown as SupabaseClient;
    const repo = new GloweProfileRepository(client);
    await expect(repo.getMine()).resolves.toBeNull();
  });
});
