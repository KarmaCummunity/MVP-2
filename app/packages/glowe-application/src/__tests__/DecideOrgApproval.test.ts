import { describe, expect, it, vi } from 'vitest';

import type { GloweProfile } from '../ports/IGloweProfileRepository';
import type { IGloweAdminGateway } from '../ports/IGloweAdminGateway';
import { decideOrgApproval } from '../use-cases/DecideOrgApproval';

function approvedOrg(overrides: Partial<GloweProfile> = {}): GloweProfile {
  return {
    id: 'org-1',
    name: 'Approved Org',
    nameEn: 'Approved Org',
    email: 'approved@example.com',
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
    approvalStatus: 'approved',
    country: 'Israel',
    orgName: 'Approved Org',
    orgNameEn: 'Approved Org',
    orgWebsite: '',
    orgRegistrationNumber: '',
    orgCountry: 'Israel',
    orgField: 'Nonprofit',
    orgDescription: '',
    orgContactName: '',
    orgContactEmail: '',
    orgContactPhone: '',
    orgSize: '',
    orgSubmittedAt: '2026-07-01T10:00:00Z',
    orgReviewNote: 'Looks good',
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

describe('decideOrgApproval', () => {
  it('approves an organization with an optional note', async () => {
    const profile = approvedOrg();
    const setOrgApproval = vi.fn(async () => profile);

    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval }) },
      { profileId: 'org-1', decision: 'approved', note: '  looks good  ' },
    );

    expect(setOrgApproval).toHaveBeenCalledWith('org-1', 'approved', 'looks good');
    expect(result).toEqual({ ok: true, profile });
  });

  it('approves an organization without a note', async () => {
    const profile = approvedOrg();
    const setOrgApproval = vi.fn(async () => profile);

    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval }) },
      { profileId: 'org-1', decision: 'approved' },
    );

    expect(setOrgApproval).toHaveBeenCalledWith('org-1', 'approved', '');
    expect(result).toEqual({ ok: true, profile });
  });

  it('rejects an organization when a note is provided', async () => {
    const profile = approvedOrg({ approvalStatus: 'rejected', orgReviewNote: 'Incomplete docs' });
    const setOrgApproval = vi.fn(async () => profile);

    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval }) },
      { profileId: 'org-1', decision: 'rejected', note: 'Incomplete docs' },
    );

    expect(setOrgApproval).toHaveBeenCalledWith('org-1', 'rejected', 'Incomplete docs');
    expect(result).toEqual({ ok: true, profile });
  });

  it('requires a note when rejecting without calling the gateway', async () => {
    const setOrgApproval = vi.fn();

    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval }) },
      { profileId: 'org-1', decision: 'rejected', note: '   ' },
    );

    expect(setOrgApproval).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Rejection reason required.',
    });
  });

  it('returns a validation error when profileId is missing', async () => {
    const setOrgApproval = vi.fn();

    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval }) },
      { profileId: '  ', decision: 'approved' },
    );

    expect(setOrgApproval).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Missing organization.',
    });
  });

  it('returns a validation error for an invalid decision', async () => {
    const setOrgApproval = vi.fn();

    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval }) },
      { profileId: 'org-1', decision: 'maybe' },
    );

    expect(setOrgApproval).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Invalid decision.',
    });
  });

  it('returns a forbidden result for reviewer-gated RPC failures', async () => {
    const result = await decideOrgApproval(
      {
        admin: makeAdminGateway({
          setOrgApproval: vi.fn(async () => {
            throw { code: '42501', message: 'permission denied' };
          }),
        }),
      },
      { profileId: 'org-1', decision: 'approved' },
    );

    expect(result).toEqual({
      ok: false,
      forbidden: true,
      error: 'Only GloWe reviewers can approve or reject organizations.',
    });
  });

  it('returns an error when the gateway returns null', async () => {
    const result = await decideOrgApproval(
      { admin: makeAdminGateway({ setOrgApproval: vi.fn(async () => null) }) },
      { profileId: 'org-1', decision: 'approved' },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not save decision.',
    });
  });

  it('returns a generic error for unexpected gateway failures', async () => {
    const result = await decideOrgApproval(
      {
        admin: makeAdminGateway({
          setOrgApproval: vi.fn(async () => {
            throw new Error('network down');
          }),
        }),
      },
      { profileId: 'org-1', decision: 'approved' },
    );

    expect(result).toEqual({
      ok: false,
      error: 'Could not save decision.',
    });
  });
});
