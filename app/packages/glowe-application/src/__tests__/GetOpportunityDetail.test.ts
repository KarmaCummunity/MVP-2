import { describe, expect, it, vi } from 'vitest';

import type {
  GloweOpportunityRow,
  IGloweOpportunityRepository,
} from '../ports/IGloweOpportunityRepository';
import {
  filterEvents,
  findRegistration,
  isEvent,
  isEventCancelled,
  isUpcoming,
  sortByStart,
} from '../helpers/eventHelpers';
import { mapOpportunityRow } from '../helpers/opportunityCatalog';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-06-29T12:00:00Z');

function evt(overrides: Partial<GloweOpportunityRow> = {}) {
  return mapOpportunityRow({
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
    ...overrides,
  });
}

describe('isEvent', () => {
  it('is true when a start date is present', () => {
    expect(isEvent(evt())).toBe(true);
    expect(isEvent(mapOpportunityRow({
      id: 'e2',
      title: 'Online',
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
    }))).toBe(true);
  });

  it('is false for plain opportunities', () => {
    expect(isEvent(mapOpportunityRow({
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
    }))).toBe(false);
  });
});

describe('filterEvents', () => {
  const list = [
    mapOpportunityRow({
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
    }),
    evt({ id: 'p-up', start_at: new Date(NOW + 24 * HOUR).toISOString(), event_type: 'physical' }),
    evt({ id: 'd-up', start_at: new Date(NOW + 48 * HOUR).toISOString(), event_type: 'digital' }),
    evt({ id: 'p-past', start_at: new Date(NOW - 48 * HOUR).toISOString(), event_type: 'physical' }),
  ];

  it('drops non-events and filters by type and timeframe', () => {
    expect(filterEvents(list, { type: 'all' }, NOW).map((e) => e.id)).toHaveLength(3);
    expect(filterEvents(list, { type: 'digital' }, NOW).map((e) => e.id)).toEqual(['d-up']);
    const upcoming = filterEvents(list, { timeframe: 'upcoming' }, NOW).map((e) => e.id);
    expect(upcoming).toContain('p-up');
    expect(upcoming).toContain('d-up');
    expect(upcoming).not.toContain('p-past');
  });
});

describe('sortByStart', () => {
  it('orders soonest start first', () => {
    const list = [
      evt({ id: 'late', start_at: new Date(NOW + 48 * HOUR).toISOString() }),
      evt({ id: 'soon', start_at: new Date(NOW + 1 * HOUR).toISOString() }),
    ];
    expect(sortByStart(list).map((e) => e.id)).toEqual(['soon', 'late']);
  });
});

describe('findRegistration', () => {
  const regs = [
    { opportunity_id: 'o1', status: 'Cancelled' },
    { opportunity_id: 'o1', status: 'Accepted' },
    { opportunityId: 'o2', status: 'Declined' },
  ];

  it('returns the live registration and ignores cancelled history', () => {
    expect(findRegistration(regs, 'o1')?.status).toBe('Accepted');
    expect(findRegistration(regs, 'o2')).toBeNull();
    expect(findRegistration(regs, null)).toBeNull();
  });
});

describe('isEventCancelled', () => {
  it('reflects cancelled status', () => {
    expect(isEventCancelled({ status: 'cancelled' })).toBe(true);
    expect(isEventCancelled({ status: 'active' })).toBe(false);
  });
});

describe('isUpcoming', () => {
  it('includes ongoing events', () => {
    const ongoing = evt({
      start_at: new Date(NOW - HOUR).toISOString(),
      end_at: new Date(NOW + HOUR).toISOString(),
    });
    expect(isUpcoming(ongoing, NOW)).toBe(true);
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

describe('getOpportunityDetail', () => {
  it('returns a listed opportunity by id', async () => {
    const { getOpportunityDetail } = await import('../use-cases/GetOpportunityDetail');
    const listAll = vi.fn(async () => [
      {
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
      },
      {
        id: 'o2',
        title: 'Removed',
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
        status: 'removed',
      },
    ]);

    const detail = await getOpportunityDetail(
      { opportunities: makeOpportunities({ listAll }) },
      { id: 'o1' },
    );

    expect(detail).toMatchObject({ id: 'o1', title: 'Mentor' });
    expect(
      await getOpportunityDetail(
        { opportunities: makeOpportunities({ listAll }) },
        { id: 'o2' },
      ),
    ).toBeNull();
  });
});
