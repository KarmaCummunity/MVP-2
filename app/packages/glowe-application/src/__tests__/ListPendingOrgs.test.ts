import { describe, expect, it, vi } from 'vitest';

import type { GloweProfile } from '../ports/IGloweProfileRepository';
import type { IGloweAdminGateway } from '../ports/IGloweAdminGateway';
import { listPendingOrgs } from '../use-cases/ListPendingOrgs';

function pendingOrg(overrides: Partial<GloweProfile> = {}): GloweProfile {
  return {
    id: 'org-pending-1',
    name: 'Pending Org',
    nameEn: 'Pending Org',
    email: 'pending@example.com',
    type: 'Organization',
    focus: 'Education',
    about: '',
    needs: '',
    location: 'Tel Aviv',
    languages: [],
    availability: '',
    skills: [],
    avatarUrl: '',
    profileStatus: null,
    accountType: 'organization',
    onboardingComplete: true,
    approvalStatus: 'pending',
    country: 'Israel',
    orgName: 'Pending Org',
    orgNameEn: 'Pending Org',
    orgWebsite: 'https://pending.example',
    orgRegistrationNumber: '123',
    orgCountry: 'Israel',
    orgField: 'Nonprofit',
    orgDescription: 'Awaiting review',
    orgContactName: 'Contact',
    orgContactEmail: 'pending@example.com',
    orgContactPhone: '',
    orgSize: '1-10',
    orgSubmittedAt: '2026-07-01T10:00:00Z',
    orgReviewNote: '',
    ...overrides,
  };
}

function makeAdminGateway(
  overrides: Partial<IGloweAdminGateway>,
): IGloweAdminGateway {
  return {
    isGloweAdmin: vi.fn(async () => false),
    fetchCounts: vi.fn(async () => ({ members: 0, orgs: 0 })),
    listPendingOrgs: vi.fn(async () => []),
    setOrgApproval: vi.fn(async () => null),
    listReports: vi.fn(async () => []),
    dismissReport: vi.fn(async () => null),
    removeContent: vi.fn(async () => null),
    healthSummary: vi.fn(async () => []),
    listHealthChecks: vi.fn(async () => []),
    ...overrides,
  };
}

describe('listPendingOrgs', () => {
  it('returns pending organizations from the admin gateway', async () => {
    const orgs = [pendingOrg(), pendingOrg({ id: 'org-pending-2' })];
    const listPendingOrgsImpl = vi.fn(async () => orgs);

    const result = await listPendingOrgs({
      admin: makeAdminGateway({ listPendingOrgs: listPendingOrgsImpl }),
    });

    expect(listPendingOrgsImpl).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true, orgs });
  });

  it('treats a null gateway response as an empty queue', async () => {
    const result = await listPendingOrgs({
      admin: makeAdminGateway({ listPendingOrgs: vi.fn(async () => null) }),
    });

    expect(result).toEqual({ ok: true, orgs: [] });
  });

  it('returns a forbidden result for reviewer-gated RPC failures', async () => {
    const result = await listPendingOrgs({
      admin: makeAdminGateway({
        listPendingOrgs: vi.fn(async () => {
          throw { code: '42501', message: 'permission denied' };
        }),
      }),
    });

    expect(result).toEqual({
      ok: false,
      forbidden: true,
      error: 'Only GloWe reviewers can view the organization queue.',
    });
  });

  it('returns a forbidden result when the error message mentions permission', async () => {
    const result = await listPendingOrgs({
      admin: makeAdminGateway({
        listPendingOrgs: vi.fn(async () => {
          throw { message: 'Forbidden: reviewer role required' };
        }),
      }),
    });

    expect(result).toEqual({
      ok: false,
      forbidden: true,
      error: 'Only GloWe reviewers can view the organization queue.',
    });
  });

  it('returns a generic error for unexpected gateway failures', async () => {
    const result = await listPendingOrgs({
      admin: makeAdminGateway({
        listPendingOrgs: vi.fn(async () => {
          throw new Error('network down');
        }),
      }),
    });

    expect(result).toEqual({
      ok: false,
      error: 'Could not load the organization queue.',
    });
  });
});
