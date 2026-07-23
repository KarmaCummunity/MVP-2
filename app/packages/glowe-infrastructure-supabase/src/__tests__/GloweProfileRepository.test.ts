import { describe, expect, it } from 'vitest';

import { GloweProfileRepository } from '../repositories/GloweProfileRepository';
import { mockSupabaseClient, USER_ID } from './helpers/mockSupabaseClient';

const baseRow = {
  id: USER_ID,
  display_name: 'Test',
  display_name_en: 'Test',
  email: 'u@test.com',
  profile_type: 'Individual',
  account_type: 'individual',
  onboarding_complete: true,
  approval_status: 'not_required',
};

describe('GloweProfileRepository', () => {
  it('getById queries glowe_profiles', async () => {
    const client = mockSupabaseClient({ profileRow: baseRow });
    const repo = new GloweProfileRepository(client);

    const profile = await repo.getById(USER_ID);

    expect(client.from).toHaveBeenCalledWith('glowe_profiles');
    expect(profile?.name).toBe('Test');
  });

  it('getById returns null for empty id', async () => {
    const client = mockSupabaseClient();
    const repo = new GloweProfileRepository(client);
    await expect(repo.getById('')).resolves.toBeNull();
  });

  it('getMine returns null when unauthenticated', async () => {
    const client = mockSupabaseClient({ user: null });
    const repo = new GloweProfileRepository(client);
    await expect(repo.getMine()).resolves.toBeNull();
  });

  it('upsert writes profile for current user', async () => {
    const client = mockSupabaseClient({ upsertRow: baseRow });
    const repo = new GloweProfileRepository(client);

    const profile = await repo.upsert({ name: 'Test', type: 'Individual' });

    expect(profile?.name).toBe('Test');
    expect(client.from).toHaveBeenCalledWith('glowe_profiles');
  });

  it('completeOnboarding upserts individual profile', async () => {
    const client = mockSupabaseClient({
      upsertRow: { ...baseRow, display_name: 'Naveh' },
      invokeResult: { data: { results: [{ textEn: 'Naveh' }] }, error: null },
    });
    const repo = new GloweProfileRepository(client);

    const profile = await repo.completeOnboarding({
      accountType: 'individual',
      displayName: 'Naveh',
      country: 'IL',
    });

    expect(profile?.name).toBe('Naveh');
  });

  it('deleteMine removes current profile', async () => {
    const client = mockSupabaseClient();
    const repo = new GloweProfileRepository(client);
    await expect(repo.deleteMine()).resolves.toBe(true);
  });

  it('uploadAvatar stores file and returns public url', async () => {
    const client = mockSupabaseClient();
    const repo = new GloweProfileRepository(client);
    const file = new Blob(['x'], { type: 'image/png' });

    await expect(repo.uploadAvatar(file)).resolves.toBe('https://cdn.example/avatar.jpg');
  });

  it('ensureFromGoogle returns existing profile without upsert when present', async () => {
    const client = mockSupabaseClient({ profileRow: baseRow });
    const repo = new GloweProfileRepository(client);

    const profile = await repo.ensureFromGoogle({
      id: USER_ID,
      email: 'u@test.com',
      user_metadata: { name: 'Test' },
    });

    expect(profile?.name).toBe('Test');
  });

  it('ensureEnglishNames returns patches from edge function', async () => {
    const client = mockSupabaseClient({
      invokeResult: {
        data: { profiles: [{ id: USER_ID, nameEn: 'Test' }] },
        error: null,
      },
    });
    const repo = new GloweProfileRepository(client);

    await expect(repo.ensureEnglishNames([USER_ID])).resolves.toEqual([
      { id: USER_ID, nameEn: 'Test' },
    ]);
  });

  it('listApprovedOrgs maps organization rows', async () => {
    const client = mockSupabaseClient({
      profileRows: [{ ...baseRow, account_type: 'organization', approval_status: 'approved' }],
    });
    const repo = new GloweProfileRepository(client);

    const orgs = await repo.listApprovedOrgs();
    expect(orgs).toHaveLength(1);
    expect(orgs?.[0]?.accountType).toBe('organization');
  });

  it('listMembers maps individual rows', async () => {
    const client = mockSupabaseClient({ profileRows: [baseRow] });
    const repo = new GloweProfileRepository(client);

    const members = await repo.listMembers();
    expect(members).toHaveLength(1);
    expect(members?.[0]?.accountType).toBe('individual');
  });
});
