import { describe, expect, it } from 'vitest';

import { fromProfileRow } from '../mappers/profileRow';

describe('fromProfileRow', () => {
  it('maps snake_case DB row to GloweProfile', () => {
    const profile = fromProfileRow({
      id: 'user-1',
      display_name: 'נווה',
      display_name_en: 'Naveh',
      email: 'n@example.com',
      profile_type: 'Individual',
      account_type: 'individual',
      onboarding_complete: true,
      approval_status: 'not_required',
      org_name: '',
      languages: ['he', 'en'],
      skills: ['teaching'],
    });

    expect(profile).toMatchObject({
      id: 'user-1',
      name: 'נווה',
      nameEn: 'Naveh',
      email: 'n@example.com',
      accountType: 'individual',
      onboardingComplete: true,
      approvalStatus: 'not_required',
      languages: ['he', 'en'],
      skills: ['teaching'],
    });
  });

  it('returns null for empty row', () => {
    expect(fromProfileRow(null)).toBeNull();
  });
});
