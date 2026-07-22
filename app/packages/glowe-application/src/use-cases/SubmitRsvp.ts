import { validateEventDraft } from '@kc/glowe-domain';

import type {
  EventRegistrationContact,
  GloweApplicationRow,
  IGloweOpportunityRepository,
} from '../ports/IGloweOpportunityRepository';
import {
  findRegistration,
  isEvent,
  isEventCancelled,
  isEventOpenForRegistration,
} from '../helpers/eventHelpers';
import type { OpportunityViewModel } from '../helpers/opportunityCatalog';
import { findListedOpportunity } from './GetOpportunityDetail';

export interface SubmitRsvpDeps {
  readonly opportunities: IGloweOpportunityRepository;
}

export interface SubmitRsvpInput {
  readonly opportunityId: string;
  readonly contact?: EventRegistrationContact;
}

export type SubmitRsvpResult =
  | { readonly ok: true; readonly registration: GloweApplicationRow }
  | { readonly ok: false; readonly error: string };

function eventDraftFromOpportunity(
  opportunity: OpportunityViewModel,
): Parameters<typeof validateEventDraft>[0] {
  return {
    title: opportunity.title,
    start_at: opportunity.startAt ?? undefined,
    end_at: opportunity.endAt ?? undefined,
    capacity: opportunity.capacity,
  };
}

export function validateRsvpTarget(
  opportunity: OpportunityViewModel | null | undefined,
): SubmitRsvpResult | { readonly ok: true; readonly opportunity: OpportunityViewModel } {
  if (!opportunity) {
    return { ok: false, error: 'Opportunity not found.' };
  }
  if (!isEvent(opportunity)) {
    return { ok: false, error: 'This opportunity is not an event.' };
  }
  if (isEventCancelled(opportunity)) {
    return { ok: false, error: 'This event has been cancelled by the organizer.' };
  }
  if (!isEventOpenForRegistration(opportunity)) {
    return { ok: false, error: 'This event is no longer open for registration.' };
  }
  const schedule = validateEventDraft(eventDraftFromOpportunity(opportunity));
  if (!schedule.valid) {
    return { ok: false, error: schedule.error };
  }
  return { ok: true, opportunity };
}

export async function submitRsvp(
  deps: SubmitRsvpDeps,
  input: SubmitRsvpInput,
): Promise<SubmitRsvpResult> {
  if (!input.opportunityId?.trim()) {
    return { ok: false, error: 'Missing event to register for.' };
  }

  const rows = await deps.opportunities.listAll();
  const target = findListedOpportunity(rows ?? [], input.opportunityId);
  const validation = validateRsvpTarget(target);
  if (!validation.ok) return validation;

  const existing = await deps.opportunities.listMyRegistrations();
  if (findRegistration(existing ?? [], input.opportunityId)) {
    return {
      ok: false,
      error: 'You are already registered for this event.',
    };
  }

  const registration = await deps.opportunities.registerForEvent(
    input.opportunityId,
    input.contact,
  );
  if (!registration) {
    return { ok: false, error: 'Could not complete your registration. Please try again.' };
  }

  return { ok: true, registration };
}
