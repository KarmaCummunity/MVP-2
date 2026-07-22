import type { IGloweProfileRepository } from '../ports/IGloweProfileRepository';
import {
  filterOrganizations,
  mapApprovedOrgProfiles,
  type OrganizationFilters,
  type OrganizationViewModel,
} from '../helpers/organizationCatalog';

export type { OrganizationFilters, OrganizationViewModel };

export interface ListOrganizationsDeps {
  readonly profiles: IGloweProfileRepository;
}

export interface ListOrganizationsInput {
  readonly lang?: string;
  readonly filters?: OrganizationFilters;
}

export async function listOrganizations(
  deps: ListOrganizationsDeps,
  input: ListOrganizationsInput = {},
): Promise<readonly OrganizationViewModel[]> {
  const rows = await deps.profiles.listApprovedOrgs();
  const mapped = mapApprovedOrgProfiles(rows ?? [], input.lang);
  if (!input.filters) return mapped;
  return filterOrganizations(mapped, input.filters);
}
