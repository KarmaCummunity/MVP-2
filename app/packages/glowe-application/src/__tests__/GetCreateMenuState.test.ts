import { describe, expect, it, vi } from 'vitest';

import type {
  GloweProfile,
  IGloweProfileRepository,
} from '../ports/IGloweProfileRepository';
import { getCreateMenuState } from '../use-cases/GetCreateMenuState';

function makeProfile(
  overrides: Partial<GloweProfile> = {},
): GloweProfile {
  return {
    id: 'user-1',
    name: 'Test User',
    nameEn: 'Test User',
    email: 'test@example.com',
    type: 'individual',
    focus: '',
    about: '',
    needs: '',
    location: '',
    languages: [],
    availability: '',
    skills: [],
    avatarUrl: '',
    profileStatus: null,
    accountType: 'individual',
    onboardingComplete: true,
    approvalStatus: 'not_required',
    country: '',
    orgName: '',
    orgNameEn: '',
    orgWebsite: '',
    orgRegistrationNumber: '',
    orgCountry: '',
    orgField: '',
    orgDescription: '',
    orgContactName: '',
    orgContactEmail: '',
    orgContactPhone: '',
    orgSize: '',
    orgSubmittedAt: null,
    orgReviewNote: '',
    ...overrides,
  };
}

function makeProfiles(
  getMine: IGloweProfileRepository['getMine'],
): IGloweProfileRepository {
  return {
    getById: vi.fn(),
    getMine,
    upsert: vi.fn(),
    completeOnboarding: vi.fn(),
    deleteMine: vi.fn(),
    uploadAvatar: vi.fn(),
    ensureFromGoogle: vi.fn(),
    ensureEnglishNames: vi.fn(),
    listApprovedOrgs: vi.fn(),
    listMembers: vi.fn(),
  };
}

describe('getCreateMenuState', () => {
  it('returns anon state for signed-out viewers without fetching profile', async () => {
    const getMine = vi.fn();
    const state = await getCreateMenuState(
      { profiles: makeProfiles(getMine) },
      { loggedIn: false },
    );

    expect(state.state).toBe('anon');
    expect(state.types).toHaveLength(0);
    expect(getMine).not.toHaveBeenCalled();
  });

  it('returns individual create types for approved members', async () => {
    const state = await getCreateMenuState(
      {
        profiles: makeProfiles(async () =>
          makeProfile({
            accountType: 'individual',
            approvalStatus: 'not_required',
          }),
        ),
      },
      { loggedIn: true },
    );

    expect(state.state).toBe('ok');
    expect(state.types.map((t) => t.id)).toEqual(['post', 'need', 'offer']);
  });

  it('returns unverified for pending organizations', async () => {
    const state = await getCreateMenuState(
      {
        profiles: makeProfiles(async () =>
          makeProfile({
            accountType: 'organization',
            approvalStatus: 'pending',
          }),
        ),
      },
      { loggedIn: true },
    );

    expect(state.state).toBe('unverified');
    expect(state.types).toHaveLength(0);
  });

  it('returns organization create types when approved', async () => {
    const state = await getCreateMenuState(
      {
        profiles: makeProfiles(async () =>
          makeProfile({
            accountType: 'organization',
            approvalStatus: 'approved',
          }),
        ),
      },
      { loggedIn: true },
    );

    expect(state.state).toBe('ok');
    expect(state.types.map((t) => t.id)).toEqual([
      'post',
      'event',
      'opportunity',
      'need',
    ]);
  });

  it('defaults to individual types when profile row is missing', async () => {
    const state = await getCreateMenuState(
      { profiles: makeProfiles(async () => null) },
      { loggedIn: true },
    );

    expect(state.state).toBe('ok');
    expect(state.types.map((t) => t.id)).toEqual(['post', 'need', 'offer']);
  });
});
