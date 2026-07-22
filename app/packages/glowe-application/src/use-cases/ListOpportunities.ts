import type { GloweListOrder } from '../ports/GloweListOrder';
import type { IGloweOpportunityRepository } from '../ports/IGloweOpportunityRepository';
import {
  filterEvents,
  sortByStart,
  type EventFilters,
} from '../helpers/eventHelpers';
import {
  filterOpportunityCatalog,
  isListedOpportunity,
  mapOpportunityRow,
  type OpportunityCatalogFilters,
  type OpportunityViewModel,
} from '../helpers/opportunityCatalog';

export type { OpportunityCatalogFilters, OpportunityViewModel };

export interface ListOpportunitiesDeps {
  readonly opportunities: IGloweOpportunityRepository;
}

export interface ListOpportunitiesInput {
  readonly order?: GloweListOrder;
  readonly filters?: OpportunityCatalogFilters;
  readonly event?: 'all' | 'physical' | 'digital' | 'upcoming';
  readonly nowMs?: number;
}

export function mapListedOpportunityRows(
  rows: readonly Parameters<typeof mapOpportunityRow>[0][] | null | undefined,
): readonly OpportunityViewModel[] {
  return (rows ?? [])
    .filter(isListedOpportunity)
    .map(mapOpportunityRow);
}

function applyEventFilter(
  list: readonly OpportunityViewModel[],
  event: ListOpportunitiesInput['event'],
  nowMs?: number,
): readonly OpportunityViewModel[] {
  if (!event || event === 'all') return list;
  const eventFilters: EventFilters = event === 'physical' || event === 'digital'
    ? { type: event }
    : { timeframe: event === 'upcoming' ? 'upcoming' : 'all' };
  return sortByStart(filterEvents(list, eventFilters, nowMs));
}

export async function listOpportunities(
  deps: ListOpportunitiesDeps,
  input: ListOpportunitiesInput = {},
): Promise<readonly OpportunityViewModel[]> {
  const rows = await deps.opportunities.listAll(input.order);
  const listed = mapListedOpportunityRows(rows ?? []);
  const catalogFiltered = input.filters
    ? filterOpportunityCatalog(listed, input.filters)
    : listed;
  return applyEventFilter(catalogFiltered, input.event, input.nowMs);
}
