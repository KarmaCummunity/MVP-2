import { localizedProfileName } from '@kc/glowe-domain';

import type { GloweProfile } from '../ports/IGloweProfileRepository';

export interface OrganizationViewModel {
  readonly id: string;
  readonly name: string;
  readonly namePrimary: string;
  readonly nameEn: string;
  readonly type: string;
  readonly mission: string;
  readonly missionField: 'org_description' | 'about';
  readonly location: string;
  readonly scope: string;
  readonly volunteers: number;
  readonly impactArea: string;
  readonly status: string;
  readonly size: string;
  readonly website: string;
}

export interface OrganizationFilters {
  readonly search?: string;
  readonly region?: string;
  readonly type?: string;
}

export function mapProfileToOrganization(
  profile: GloweProfile | null | undefined,
  lang = 'he',
): OrganizationViewModel {
  const source = profile ?? ({} as GloweProfile);
  const primary = source.orgName || source.name || 'Organization';
  const english = source.orgNameEn || source.nameEn || '';
  const mission = source.orgDescription || source.about || '';

  return {
    id: source.id ?? '',
    name: localizedProfileName(
      {
        accountType: source.accountType ?? undefined,
        orgName: source.orgName,
        orgNameEn: source.orgNameEn,
        name: source.name,
        nameEn: source.nameEn,
      },
      lang,
    ) || primary,
    namePrimary: primary,
    nameEn: english,
    type: source.orgField || source.type || 'Organization',
    mission,
    missionField: source.orgDescription ? 'org_description' : 'about',
    location: source.orgCountry || source.location || '',
    scope: source.country || '',
    volunteers: 0,
    impactArea: source.focus || '',
    status: 'Verified',
    size: source.orgSize || '',
    website: source.orgWebsite || '',
  };
}

export function mapApprovedOrgProfiles(
  rows: readonly GloweProfile[] | null | undefined,
  lang = 'he',
): readonly OrganizationViewModel[] {
  return (rows ?? []).map((row) => mapProfileToOrganization(row, lang));
}

function matchesRegion(org: OrganizationViewModel, region: string): boolean {
  const needle = region.toLowerCase();
  return [org.location, org.scope].filter(Boolean).some((value) =>
    String(value).toLowerCase().includes(needle),
  );
}

export function filterOrganizations(
  organizations: readonly OrganizationViewModel[] | null | undefined,
  filters: OrganizationFilters = {},
): readonly OrganizationViewModel[] {
  const list = Array.isArray(organizations) ? organizations : [];
  const query = String(filters.search ?? '').trim().toLowerCase();
  const region = String(filters.region ?? 'all').trim();
  const type = String(filters.type ?? 'all').trim();

  return list.filter((org) => {
    const searchable = [
      org.name,
      org.type,
      org.mission,
      org.impactArea,
      org.location,
      org.scope,
      org.size,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const regionMatch = region === 'all' || region === '' || matchesRegion(org, region);
    const typeMatch =
      type === 'all'
      || type === ''
      || String(org.type || '').toLowerCase() === type.toLowerCase();
    const queryMatch = !query || searchable.includes(query);
    return regionMatch && typeMatch && queryMatch;
  });
}
