import { describe, expect, it, vi } from 'vitest';

import type {
  GloweProfile,
  IGloweProfileRepository,
} from '../ports/IGloweProfileRepository';
import {
  filterOrganizations,
  mapProfileToOrganization,
} from '../helpers/organizationCatalog';

function orgProfile(overrides: Partial<GloweProfile> = {}): GloweProfile {
  return {
    id: 'org-1',
    name: 'Open Heart',
    nameEn: 'Open Heart',
    email: 'contact@openheart.dev',
    type: 'Organization',
    focus: 'Education',
    about: 'Community support',
    needs: '',
    location: 'Tel Aviv',
    languages: [],
    availability: '',
    skills: [],
    avatarUrl: '',
    profileStatus: null,
    accountType: 'organization',
    onboardingComplete: true,
    approvalStatus: 'approved',
    country: 'Israel',
    orgName: 'לב פתוח',
    orgNameEn: 'Open Heart',
    orgWebsite: 'https://openheart.dev',
    orgRegistrationNumber: '',
    orgCountry: 'Israel',
    orgField: 'Nonprofit',
    orgDescription: 'Helping families in need',
    orgContactName: '',
    orgContactEmail: '',
    orgContactPhone: '',
    orgSize: '11-50',
    orgSubmittedAt: null,
    orgReviewNote: '',
    ...overrides,
  };
}

function makeProfiles(
  overrides: Partial<IGloweProfileRepository>,
): IGloweProfileRepository {
  return {
    getById: vi.fn(),
    getMine: vi.fn(),
    upsert: vi.fn(),
    completeOnboarding: vi.fn(),
    deleteMine: vi.fn(),
    uploadAvatar: vi.fn(),
    ensureFromGoogle: vi.fn(),
    ensureEnglishNames: vi.fn(),
    listApprovedOrgs: vi.fn(async () => []),
    listMembers: vi.fn(),
    ...overrides,
  };
}

describe('mapProfileToOrganization', () => {
  it('maps an approved organization profile into the directory card shape', () => {
    expect(mapProfileToOrganization(orgProfile(), 'en')).toEqual({
      id: 'org-1',
      name: 'Open Heart',
      namePrimary: 'לב פתוח',
      nameEn: 'Open Heart',
      type: 'Nonprofit',
      mission: 'Helping families in need',
      missionField: 'org_description',
      location: 'Israel',
      scope: 'Israel',
      volunteers: 0,
      impactArea: 'Education',
      status: 'Verified',
      size: '11-50',
      website: 'https://openheart.dev',
    });
  });

  it('falls back to about and profile type when org fields are missing', () => {
    expect(
      mapProfileToOrganization(
        orgProfile({
          orgField: '',
          orgDescription: '',
          orgCountry: '',
          orgWebsite: '',
          orgSize: '',
          type: 'Community group',
          about: 'Grassroots support',
        }),
        'he',
      ),
    ).toMatchObject({
      type: 'Community group',
      mission: 'Grassroots support',
      missionField: 'about',
      location: 'Tel Aviv',
      website: '',
      size: '',
    });
  });
});

describe('filterOrganizations', () => {
  const orgs = [
    mapProfileToOrganization(orgProfile({ id: 'a', orgField: 'Nonprofit' }), 'en'),
    mapProfileToOrganization(
      orgProfile({
        id: 'b',
        orgName: 'Green Coast',
        orgNameEn: 'Green Coast',
        orgField: 'Environment',
        orgCountry: 'Haifa',
        country: 'Israel',
        focus: 'Climate',
      }),
      'en',
    ),
  ];

  it('filters by search, region, and type', () => {
    expect(filterOrganizations(orgs, { search: 'green' }).map((org) => org.id)).toEqual(['b']);
    expect(filterOrganizations(orgs, { region: 'haifa' }).map((org) => org.id)).toEqual(['b']);
    expect(filterOrganizations(orgs, { type: 'nonprofit' }).map((org) => org.id)).toEqual(['a']);
  });

  it('returns all organizations when filters are empty or set to all', () => {
    expect(filterOrganizations(orgs, {})).toHaveLength(2);
    expect(filterOrganizations(orgs, { region: 'all', type: 'all' })).toHaveLength(2);
  });

  it('returns an empty array for non-array input', () => {
    expect(filterOrganizations(null, { search: 'x' })).toEqual([]);
  });
});

describe('listOrganizations', () => {
  it('fetches approved organizations and applies filters', async () => {
    const { listOrganizations } = await import('../use-cases/ListOrganizations');
    const listApprovedOrgs = vi.fn(async () => [
      orgProfile({ id: 'a', orgField: 'Nonprofit' }),
      orgProfile({
        id: 'b',
        orgName: 'Green Coast',
        orgNameEn: 'Green Coast',
        orgField: 'Environment',
        orgCountry: 'Haifa',
        focus: 'Climate',
      }),
    ]);

    const items = await listOrganizations(
      { profiles: makeProfiles({ listApprovedOrgs }) },
      { lang: 'en', filters: { search: 'green' } },
    );

    expect(listApprovedOrgs).toHaveBeenCalledOnce();
    expect(items.map((item) => item.id)).toEqual(['b']);
  });

  it('returns mapped organizations when no filters are provided', async () => {
    const { listOrganizations } = await import('../use-cases/ListOrganizations');
    const listApprovedOrgs = vi.fn(async () => [orgProfile()]);

    const items = await listOrganizations(
      { profiles: makeProfiles({ listApprovedOrgs }) },
      { lang: 'en' },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe('Open Heart');
  });
});
