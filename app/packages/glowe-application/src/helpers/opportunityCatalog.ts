import type { GloweOpportunityRow } from '../ports/IGloweOpportunityRepository';

export interface OpportunityViewModel {
  readonly id: string;
  readonly title: string;
  readonly organization: string;
  readonly organizationEn: string;
  readonly orgIcon: string;
  readonly location: string;
  readonly commitment: string;
  readonly duration: string;
  readonly field: string;
  readonly description: string;
  readonly skills: readonly string[];
  readonly featured: boolean;
  readonly ownerId: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly eventType: string | null;
  readonly capacity: number | null;
  readonly registrationMode: string;
  readonly status: string;
}

export interface OpportunityCatalogFilters {
  readonly location?: string;
  readonly field?: string;
  readonly commitment?: string;
  readonly search?: string;
}

type ApplicationRef = {
  readonly opportunity_id?: string;
  readonly opportunityId?: string;
  readonly user_id?: string;
  readonly userId?: string;
};

export function isListedOpportunity(
  row: GloweOpportunityRow | null | undefined,
): boolean {
  if (!row) return false;
  const status = row.status !== undefined ? row.status : 'active';
  return status !== 'removed';
}

export function mapOpportunityRow(
  row: GloweOpportunityRow | null | undefined,
): OpportunityViewModel {
  const source = row ?? ({} as GloweOpportunityRow);
  const skills = Array.isArray(source.skills)
    ? source.skills
    : String(source.skills ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    id: source.id ?? '',
    title: source.title ?? '',
    organization: source.organization || 'GloWe Member',
    organizationEn: source.organization_en ?? '',
    orgIcon: source.org_icon ?? '',
    location: source.location ?? '',
    commitment: source.commitment ?? '',
    duration: source.duration ?? '',
    field: source.field ?? '',
    description: source.description ?? '',
    skills,
    featured: Boolean(source.featured),
    ownerId: source.user_id ?? null,
    startAt: source.start_at ?? null,
    endAt: source.end_at ?? null,
    eventType: source.event_type ?? null,
    capacity: typeof source.capacity === 'number' ? source.capacity : null,
    registrationMode: source.registration_mode ?? 'gated',
    status: source.status ?? 'active',
  };
}

export function filterOpportunityCatalog(
  opportunityList: readonly OpportunityViewModel[],
  filters: OpportunityCatalogFilters | null | undefined,
): readonly OpportunityViewModel[] {
  const f = filters ?? {};
  return opportunityList.filter((opp) => {
    const haystack = `${opp.title} ${opp.description} ${opp.organization} ${(opp.skills || []).join(' ')}`.toLowerCase();
    if (
      f.location
      && f.location !== 'all'
      && !opp.location.toLowerCase().includes(f.location.toLowerCase())
    ) {
      return false;
    }
    if (f.field && f.field !== 'all' && opp.field !== f.field) return false;
    if (
      f.commitment
      && f.commitment !== 'all'
      && opp.commitment.toLowerCase() !== f.commitment.toLowerCase()
    ) {
      return false;
    }
    if (f.search && !haystack.includes(f.search.toLowerCase())) return false;
    return true;
  });
}

export function isDuplicateApplication(
  list: readonly ApplicationRef[] | null | undefined,
  opportunityId: string,
  userId: string | null | undefined,
): boolean {
  if (!opportunityId) return false;
  return (list ?? []).some((app) => {
    if (!app) return false;
    const oid = app.opportunity_id !== undefined
      ? app.opportunity_id
      : app.opportunityId;
    if (String(oid) !== String(opportunityId)) return false;
    const uid = app.user_id !== undefined ? app.user_id : app.userId;
    if (uid === undefined || uid === null || uid === '') return true;
    return String(uid) === String(userId);
  });
}
