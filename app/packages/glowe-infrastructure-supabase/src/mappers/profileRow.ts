import type { GloweProfile, UpsertProfileInput } from '@kc/glowe-application';

export type GloweProfileDbRow = Record<string, unknown> & {
  id?: string;
  display_name?: string | null;
  display_name_en?: string | null;
  email?: string | null;
  profile_type?: string | null;
  raw_profile?: Record<string, unknown> | null;
};

export function fromProfileRow(row: GloweProfileDbRow | null | undefined): GloweProfile | null {
  if (!row) return null;
  return {
    id: String(row.id ?? ''),
    name: String(row.display_name ?? ''),
    nameEn: String(row.display_name_en ?? ''),
    email: String(row.email ?? ''),
    type: String(row.profile_type ?? ''),
    focus: String(row.focus ?? ''),
    about: String(row.about ?? ''),
    needs: String(row.needs ?? ''),
    location: String(row.location ?? ''),
    languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
    availability: String(row.availability ?? ''),
    skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
    avatarUrl: String(row.avatar_url ?? ''),
    profileStatus: (row.profile_status as string | null) ?? null,
    accountType: (row.account_type as GloweProfile['accountType']) ?? null,
    onboardingComplete: row.onboarding_complete === true,
    approvalStatus: (row.approval_status as GloweProfile['approvalStatus']) || 'not_required',
    country: String(row.country ?? ''),
    orgName: String(row.org_name ?? ''),
    orgNameEn: String(row.org_name_en ?? ''),
    orgWebsite: String(row.org_website ?? ''),
    orgRegistrationNumber: String(row.org_registration_number ?? ''),
    orgCountry: String(row.org_country ?? ''),
    orgField: String(row.org_field ?? ''),
    orgDescription: String(row.org_description ?? ''),
    orgContactName: String(row.org_contact_name ?? ''),
    orgContactEmail: String(row.org_contact_email ?? ''),
    orgContactPhone: String(row.org_contact_phone ?? ''),
    orgSize: String(row.org_size ?? ''),
    orgSubmittedAt: (row.org_submitted_at as string | null) ?? null,
    orgReviewNote: String(row.org_review_note ?? ''),
  };
}

export function toProfileUpsertPayload(
  profile: UpsertProfileInput & { id: string; email?: string },
): Record<string, unknown> {
  return {
    id: profile.id,
    display_name: profile.name ?? '',
    display_name_en: profile.nameEn ?? null,
    email: profile.email ?? '',
    profile_type: profile.type ?? '',
    country: profile.country ?? '',
    focus: profile.focus ?? '',
    about: profile.about ?? '',
    needs: profile.needs ?? '',
    location: profile.location ?? '',
    languages: profile.languages ?? [],
    availability: profile.availability ?? '',
    skills: profile.skills ?? [],
    avatar_url: profile.avatarUrl ?? '',
    profile_status: profile.profileStatus ?? null,
    org_name: profile.orgName ?? null,
    org_name_en: profile.orgNameEn ?? null,
  };
}
