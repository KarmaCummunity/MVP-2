import type { CompleteOnboardingInput } from '@kc/glowe-application';
import type { User } from '@supabase/supabase-js';

export interface OnboardingEnglishNames {
  readonly displayNameEn: string;
  readonly orgNameEn: string | null;
}

export function buildOnboardingPayload(
  user: User,
  details: CompleteOnboardingInput,
  names: OnboardingEnglishNames,
): Record<string, unknown> {
  const isOrg = details.accountType === 'organization';
  const org = details.org ?? {};
  const displayName = details.displayName ?? '';
  const orgName = isOrg ? (org.name ?? '') : null;

  return {
    id: user.id,
    email: user.email,
    display_name: displayName,
    display_name_en: names.displayNameEn || null,
    about: details.about ?? '',
    country: details.country ?? '',
    account_type: isOrg ? 'organization' : 'individual',
    onboarding_complete: true,
    approval_status: isOrg ? 'pending' : 'not_required',
    profile_type: isOrg ? 'Organization' : 'Individual',
    org_name: orgName,
    org_name_en: names.orgNameEn || null,
    org_website: isOrg ? (org.website ?? '') : null,
    org_registration_number: isOrg ? (org.registrationNumber ?? '') : null,
    org_country: isOrg ? (org.country ?? details.country ?? '') : null,
    org_field: isOrg ? (org.field ?? '') : null,
    org_description: isOrg ? (org.description ?? '') : null,
    org_contact_name: isOrg ? (org.contactName ?? '') : null,
    org_contact_email: isOrg ? (org.contactEmail ?? user.email ?? '') : null,
    org_contact_phone: isOrg ? (org.contactPhone ?? '') : null,
    org_size: isOrg ? (org.size ?? '') : null,
    org_submitted_at: isOrg ? new Date().toISOString() : null,
  };
}
