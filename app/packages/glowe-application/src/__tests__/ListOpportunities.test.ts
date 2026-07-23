import { describe, expect, it, vi } from 'vitest';

import type {
  GloweOpportunityRow,
  IGloweOpportunityRepository,
} from '../ports/IGloweOpportunityRepository';
import {
  filterOpportunityCatalog,
  isDuplicateApplication,
  isListedOpportunity,
  mapOpportunityRow,
} from '../helpers/opportunityCatalog';

function oppRow(overrides: Partial<GloweOpportunityRow> = {}): GloweOpportunityRow {
  return {
    id: 'o1',
    title: 'Mentor youth',
    organization: 'Org A',
    organization_en: null,
    org_icon: 'OA',
    location: 'Tel Aviv',
    commitment: 'Flexible',
    duration: 'Ongoing',
    field: 'education',
    description: 'Help students',
    skills: ['Teaching'],
    requirements: 'Fluency',
    responsibilities: 'Coordinate',
    featured: false,
    ...overrides,
  };
}

describe('isListedOpportunity', () => {
  it('excludes admin-removed rows and accepts active defaults', () => {
    expect(isListedOpportunity(oppRow())).toBe(true);
    expect(isListedOpportunity(oppRow({ status: 'cancelled' }))).toBe(true);
    expect(isListedOpportunity(oppRow({ status: 'removed' }))).toBe(false);
    expect(isListedOpportunity(null)).toBe(false);
  });
});

describe('mapOpportunityRow', () => {
  it('maps server rows into the display shape', () => {
    expect(
      mapOpportunityRow(
        oppRow({
          id: 'o1',
          user_id: 'u1',
          start_at: '2026-07-06T09:00:00Z',
          event_type: 'physical',
          capacity: 20,
          registration_mode: 'open',
        }),
      ),
    ).toMatchObject({
      id: 'o1',
      title: 'Mentor youth',
      organization: 'Org A',
      ownerId: 'u1',
      startAt: '2026-07-06T09:00:00Z',
      eventType: 'physical',
      capacity: 20,
      registrationMode: 'open',
      status: 'active',
    });
  });
});

describe('filterOpportunityCatalog', () => {
  const list = [
    mapOpportunityRow(oppRow({ id: 'a', location: 'Remote', field: 'education', commitment: 'Flexible', description: 'Help students' })),
    mapOpportunityRow(oppRow({ id: 'b', location: 'Haifa', field: 'health', commitment: 'Weekly', description: 'Support clinics' })),
  ];

  it('filters by location, field, commitment, and search', () => {
    expect(filterOpportunityCatalog(list, { location: 'remote' }).map((o) => o.id)).toEqual(['a']);
    expect(filterOpportunityCatalog(list, { field: 'health' }).map((o) => o.id)).toEqual(['b']);
    expect(filterOpportunityCatalog(list, { commitment: 'weekly' }).map((o) => o.id)).toEqual(['b']);
    expect(filterOpportunityCatalog(list, { search: 'students' }).map((o) => o.id)).toEqual(['a']);
  });
});

describe('isDuplicateApplication', () => {
  it('matches local cache rows on opportunityId + userId', () => {
    const list = [
      { opportunityId: 'opp-1', userId: 'u1' },
      { opportunityId: 'opp-2', userId: 'u1' },
    ];
    expect(isDuplicateApplication(list, 'opp-1', 'u1')).toBe(true);
    expect(isDuplicateApplication(list, 'opp-3', 'u1')).toBe(false);
    expect(isDuplicateApplication(list, 'opp-1', 'u2')).toBe(false);
  });

  it('matches server rows and user-scoped rows without a user field', () => {
    expect(isDuplicateApplication([{ opportunity_id: 'opp-1', user_id: 'u1' }], 'opp-1', 'u1')).toBe(true);
    expect(isDuplicateApplication([{ opportunity_id: 'opp-1' }], 'opp-1', 'u1')).toBe(true);
    expect(isDuplicateApplication([{ opportunity_id: 'opp-2' }], 'opp-1', 'u1')).toBe(false);
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

describe('listOpportunities', () => {
  it('fetches listed opportunities and applies catalog filters', async () => {
    const { listOpportunities } = await import('../use-cases/ListOpportunities');
    const listAll = vi.fn(async () => [
      oppRow({ id: 'a', location: 'Remote' }),
      oppRow({ id: 'b', location: 'Haifa', status: 'removed' }),
    ]);

    const items = await listOpportunities(
      { opportunities: makeOpportunities({ listAll }) },
      { filters: { location: 'remote' } },
    );

    expect(listAll).toHaveBeenCalledOnce();
    expect(items.map((item) => item.id)).toEqual(['a']);
  });

  it('applies upcoming event filters and sorts by start', async () => {
    const { listOpportunities } = await import('../use-cases/ListOpportunities');
    const now = Date.parse('2026-06-29T12:00:00Z');
    const listAll = vi.fn(async () => [
      oppRow({ id: 'plain' }),
      oppRow({
        id: 'late',
        start_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
        event_type: 'physical',
      }),
      oppRow({
        id: 'soon',
        start_at: new Date(now + 1 * 60 * 60 * 1000).toISOString(),
        event_type: 'digital',
      }),
      oppRow({
        id: 'past',
        start_at: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
        event_type: 'physical',
      }),
    ]);

    const items = await listOpportunities(
      { opportunities: makeOpportunities({ listAll }) },
      { event: 'upcoming', nowMs: now },
    );

    expect(items.map((item) => item.id)).toEqual(['soon', 'late']);
  });
});
