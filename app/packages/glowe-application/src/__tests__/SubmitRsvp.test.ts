import { describe, expect, it, vi } from 'vitest';

import { validateEventDraft } from '@kc/glowe-domain';
import type {
  GloweOpportunityRow,
  IGloweOpportunityRepository,
} from '../ports/IGloweOpportunityRepository';
import { mapOpportunityRow } from '../helpers/opportunityCatalog';
import { submitRsvp, validateRsvpTarget } from '../use-cases/SubmitRsvp';

describe('validateRsvpTarget', () => {
  it('accepts an active event with a valid schedule', () => {
    const opportunity = mapOpportunityRow({
      id: 'e1',
      title: 'Beach Cleanup',
      organization: 'Org',
      organization_en: null,
      org_icon: 'O',
      location: 'Beach',
      commitment: 'Event',
      duration: '1 day',
      field: 'community',
      description: 'Cleanup',
      skills: [],
      requirements: '',
      responsibilities: '',
      featured: false,
      start_at: '2026-07-06T09:00:00Z',
      event_type: 'physical',
      status: 'active',
    });

    const result = validateRsvpTarget(opportunity);
    expect(result.ok).toBe(true);
    expect(validateEventDraft({
      title: opportunity.title,
      start_at: opportunity.startAt ?? undefined,
      end_at: opportunity.endAt ?? undefined,
      capacity: opportunity.capacity,
    }).valid).toBe(true);
  });

  it('rejects missing, non-event, cancelled, and closed targets', () => {
    expect(validateRsvpTarget(null)).toEqual({
      ok: false,
      error: 'Opportunity not found.',
    });

    const plain = mapOpportunityRow({
      id: 'o1',
      title: 'Mentor',
      organization: 'Org',
      organization_en: null,
      org_icon: 'O',
      location: '',
      commitment: 'Flexible',
      duration: '',
      field: 'community',
      description: '',
      skills: [],
      requirements: '',
      responsibilities: '',
      featured: false,
    });
    expect(validateRsvpTarget(plain).ok).toBe(false);

    const cancelled = mapOpportunityRow({
      id: 'e2',
      title: 'Cancelled',
      organization: 'Org',
      organization_en: null,
      org_icon: 'O',
      location: '',
      commitment: 'Event',
      duration: '',
      field: 'community',
      description: '',
      skills: [],
      requirements: '',
      responsibilities: '',
      featured: false,
      start_at: '2026-07-06T09:00:00Z',
      status: 'cancelled',
    });
    expect(validateRsvpTarget(cancelled).ok).toBe(false);
  });
});

function makeOpportunities(
  overrides: Partial<IGloweOpportunityRepository>,
): IGloweOpportunityRepository {
  return {
    listAll: vi.fn(async () => []),
    listMine: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    registerForEvent: vi.fn(),
    cancelRegistration: vi.fn(),
    listMyRegistrations: vi.fn(),
    listEventRegistrations: vi.fn(),
    listApplicationsForOpportunity: vi.fn(),
    updateApplicationStatus: vi.fn(),
    decideEventRegistration: vi.fn(),
    getEventLink: vi.fn(),
    cancelEvent: vi.fn(),
    ...overrides,
  };
}

describe('submitRsvp', () => {
  it('registers for an open event when no active registration exists', async () => {
    const eventRow: GloweOpportunityRow = {
      id: 'e1',
      title: 'Beach Cleanup',
      organization: 'Org',
      organization_en: null,
      org_icon: 'O',
      location: 'Beach',
      commitment: 'Event',
      duration: '1 day',
      field: 'community',
      description: 'Cleanup',
      skills: [],
      requirements: '',
      responsibilities: '',
      featured: false,
      start_at: '2026-07-06T09:00:00Z',
      event_type: 'physical',
      status: 'active',
    };
    const registerForEvent = vi.fn(async () => ({
      id: 'r1',
      opportunity_id: 'e1',
      status: 'Accepted',
    }));
    const listMyRegistrations = vi.fn(async () => []);

    const result = await submitRsvp(
      {
        opportunities: makeOpportunities({
          listAll: async () => [eventRow],
          listMyRegistrations,
          registerForEvent,
        }),
      },
      {
        opportunityId: 'e1',
        contact: { email: 'a@example.com' },
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.registration.status).toBe('Accepted');
    }
    expect(registerForEvent).toHaveBeenCalledWith('e1', { email: 'a@example.com' });
  });

  it('rejects duplicate and cancelled targets', async () => {
    const eventRow: GloweOpportunityRow = {
      id: 'e1',
      title: 'Beach Cleanup',
      organization: 'Org',
      organization_en: null,
      org_icon: 'O',
      location: 'Beach',
      commitment: 'Event',
      duration: '1 day',
      field: 'community',
      description: 'Cleanup',
      skills: [],
      requirements: '',
      responsibilities: '',
      featured: false,
      start_at: '2026-07-06T09:00:00Z',
      event_type: 'physical',
      status: 'active',
    };

    const duplicate = await submitRsvp(
      {
        opportunities: makeOpportunities({
          listAll: async () => [eventRow],
          listMyRegistrations: async () => [{ id: 'r1', opportunity_id: 'e1', status: 'Accepted' }],
        }),
      },
      { opportunityId: 'e1' },
    );
    expect(duplicate).toEqual({
      ok: false,
      error: 'You are already registered for this event.',
    });

    const cancelled = await submitRsvp(
      {
        opportunities: makeOpportunities({
          listAll: async () => [{ ...eventRow, status: 'cancelled' }],
          listMyRegistrations: async () => [],
        }),
      },
      { opportunityId: 'e1' },
    );
    expect(cancelled.ok).toBe(false);
    if (!cancelled.ok) {
      expect(cancelled.error).toMatch(/cancelled/i);
    }
  });
});
