import type { IGloweOpportunityRepository } from '../ports/IGloweOpportunityRepository';
import {
  isListedOpportunity,
  mapOpportunityRow,
  type OpportunityViewModel,
} from '../helpers/opportunityCatalog';

export type { OpportunityViewModel };

export interface GetOpportunityDetailDeps {
  readonly opportunities: IGloweOpportunityRepository;
}

export interface GetOpportunityDetailInput {
  readonly id: string;
}

export function findListedOpportunity(
  rows: readonly Parameters<typeof mapOpportunityRow>[0][] | null | undefined,
  id: string,
): OpportunityViewModel | null {
  if (!id?.trim()) return null;
  const row = (rows ?? []).find((item) => String(item?.id) === String(id));
  if (!row || !isListedOpportunity(row)) return null;
  return mapOpportunityRow(row);
}

export async function getOpportunityDetail(
  deps: GetOpportunityDetailDeps,
  input: GetOpportunityDetailInput,
): Promise<OpportunityViewModel | null> {
  const rows = await deps.opportunities.listAll();
  return findListedOpportunity(rows ?? [], input.id);
}
