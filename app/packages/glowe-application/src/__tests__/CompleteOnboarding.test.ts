import { describe, expect, it, vi } from 'vitest';

import type {
  CompleteOnboardingInput,
  GloweProfile,
  IGloweProfileRepository,
} from '../ports/IGloweProfileRepository';
import { completeOnboarding } from '../use-cases/CompleteOnboarding';

function makeProfile(): GloweProfile {
  return {
    id: 'user-1',
    name: 'Org Lead',
    nameEn: 'Org Lead',
    email: 'lead@example.com',
    type: 'organization',
    focus: '',
    about: '',
    needs: '',
    location: '',
    languages: [],
    availability: '',
    skills: [],
    avatarUrl: '',
    profileStatus: null,
    accountType: 'organization',
    onboardingComplete: true,
    approvalStatus: 'pending',
    country: 'IL',
    orgName: 'Open Hearts',
    orgNameEn: 'Open Hearts',
    orgWebsite: '',
    orgRegistrationNumber: '',
    orgCountry: 'IL',
    orgField: 'Community',
    orgDescription: '',
    orgContactName: '',
    orgContactEmail: '',
    orgContactPhone: '',
    orgSize: '',
    orgSubmittedAt: '2026-07-22T00:00:00.000Z',
    orgReviewNote: '',
  };
}

function makeProfiles(
  completeOnboardingImpl: IGloweProfileRepository['completeOnboarding'],
): IGloweProfileRepository {
  return {
    getById: vi.fn(),
    getMine: vi.fn(),
    upsert: vi.fn(),
    completeOnboarding: completeOnboardingImpl,
    deleteMine: vi.fn(),
    uploadAvatar: vi.fn(),
    ensureFromGoogle: vi.fn(),
    ensureEnglishNames: vi.fn(),
    listApprovedOrgs: vi.fn(),
    listMembers: vi.fn(),
  };
}

describe('completeOnboarding', () => {
  it('delegates to the profile repository and returns the updated profile', async () => {
    const input: CompleteOnboardingInput = {
      accountType: 'organization',
      displayName: 'Open Hearts',
      country: 'IL',
      org: { name: 'Open Hearts', field: 'Community' },
    };
    const profile = makeProfile();
    const completeOnboardingImpl = vi.fn(async () => profile);

    const result = await completeOnboarding(
      { profiles: makeProfiles(completeOnboardingImpl) },
      input,
    );

    expect(completeOnboardingImpl).toHaveBeenCalledWith(input);
    expect(result).toBe(profile);
  });

  it('returns null when the repository returns null', async () => {
    const result = await completeOnboarding(
      {
        profiles: makeProfiles(async () => null),
      },
      { accountType: 'individual', displayName: 'Alex' },
    );

    expect(result).toBeNull();
  });
});
