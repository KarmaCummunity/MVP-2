import { describe, it, expect } from 'vitest';
import GloweEvents from '../glowe-events.js';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-06-29T12:00:00Z');

function evt(overrides = {}) {
    return { id: 'e1', title: 'Beach Cleanup', start_at: '2026-07-06T09:00:00Z', event_type: 'physical', ...overrides };
}

describe('isEvent', () => {
    it('is true when a start date is present (snake or camel case)', () => {
        expect(GloweEvents.isEvent(evt())).toBe(true);
        expect(GloweEvents.isEvent({ startAt: '2026-07-06T09:00:00Z' })).toBe(true);
    });

    it('is false for plain opportunities and falsy input', () => {
        expect(GloweEvents.isEvent({ id: 'o1', title: 'Mentor' })).toBe(false);
        expect(GloweEvents.isEvent(null)).toBe(false);
    });
});

describe('eventTiming', () => {
    it('returns upcoming before the start', () => {
        expect(GloweEvents.eventTiming(evt(), NOW)).toBe('upcoming');
    });

    it('returns ongoing between start and end', () => {
        const e = evt({ start_at: new Date(NOW - HOUR).toISOString(), end_at: new Date(NOW + HOUR).toISOString() });
        expect(GloweEvents.eventTiming(e, NOW)).toBe('ongoing');
    });

    it('returns past after the end', () => {
        const e = evt({ start_at: new Date(NOW - 3 * HOUR).toISOString(), end_at: new Date(NOW - HOUR).toISOString() });
        expect(GloweEvents.eventTiming(e, NOW)).toBe('past');
    });

    it('uses start when there is no end', () => {
        expect(GloweEvents.eventTiming(evt({ start_at: new Date(NOW - HOUR).toISOString() }), NOW)).toBe('past');
        expect(GloweEvents.eventTiming(evt({ start_at: new Date(NOW + HOUR).toISOString() }), NOW)).toBe('upcoming');
    });

    it('returns null for non-events', () => {
        expect(GloweEvents.eventTiming({ id: 'o1' }, NOW)).toBeNull();
    });
});

describe('filterEvents', () => {
    const list = [
        { id: 'o1', title: 'Mentor' },
        evt({ id: 'p-up', start_at: new Date(NOW + 24 * HOUR).toISOString(), event_type: 'physical' }),
        evt({ id: 'd-up', start_at: new Date(NOW + 48 * HOUR).toISOString(), event_type: 'digital' }),
        evt({ id: 'p-past', start_at: new Date(NOW - 48 * HOUR).toISOString(), event_type: 'physical' })
    ];

    it('drops non-events entirely', () => {
        const ids = GloweEvents.filterEvents(list, { type: 'all' }, NOW).map(e => e.id);
        expect(ids).not.toContain('o1');
        expect(ids).toHaveLength(3);
    });

    it('filters by event type', () => {
        const ids = GloweEvents.filterEvents(list, { type: 'digital' }, NOW).map(e => e.id);
        expect(ids).toEqual(['d-up']);
    });

    it('filters upcoming (excludes past)', () => {
        const ids = GloweEvents.filterEvents(list, { timeframe: 'upcoming' }, NOW).map(e => e.id);
        expect(ids).toContain('p-up');
        expect(ids).toContain('d-up');
        expect(ids).not.toContain('p-past');
    });
});

describe('sortByStart', () => {
    it('orders soonest start first', () => {
        const list = [
            evt({ id: 'late', start_at: new Date(NOW + 48 * HOUR).toISOString() }),
            evt({ id: 'soon', start_at: new Date(NOW + 1 * HOUR).toISOString() })
        ];
        expect(GloweEvents.sortByStart(list).map(e => e.id)).toEqual(['soon', 'late']);
    });
});

describe('eventTypeLabel', () => {
    it('maps known types and ignores unknowns', () => {
        expect(GloweEvents.eventTypeLabel('physical')).toBe('In person');
        expect(GloweEvents.eventTypeLabel('digital')).toBe('Online');
        expect(GloweEvents.eventTypeLabel('hybrid')).toBe('');
    });
});

describe('registrationStatusLabel', () => {
    it('maps each status to a label and unknowns to empty', () => {
        expect(GloweEvents.registrationStatusLabel('Accepted')).toBe('Registered');
        expect(GloweEvents.registrationStatusLabel('Pending')).toBe('Pending approval');
        expect(GloweEvents.registrationStatusLabel('Waitlisted')).toBe('Waitlisted');
        expect(GloweEvents.registrationStatusLabel('Declined')).toBe('Not accepted');
        expect(GloweEvents.registrationStatusLabel('Cancelled')).toBe('Cancelled');
        expect(GloweEvents.registrationStatusLabel('Bogus')).toBe('');
    });
});

describe('canCancelRegistration / isActiveRegistration', () => {
    it('is true for live statuses and false otherwise', () => {
        ['Accepted', 'Pending', 'Waitlisted'].forEach(s => {
            expect(GloweEvents.canCancelRegistration(s)).toBe(true);
            expect(GloweEvents.isActiveRegistration(s)).toBe(true);
        });
        ['Declined', 'Cancelled', undefined].forEach(s => {
            expect(GloweEvents.canCancelRegistration(s)).toBe(false);
            expect(GloweEvents.isActiveRegistration(s)).toBe(false);
        });
    });
});

describe('findRegistration', () => {
    const regs = [
        { opportunity_id: 'o1', status: 'Cancelled' },
        { opportunity_id: 'o1', status: 'Accepted' },
        { opportunityId: 'o2', status: 'Declined' }
    ];

    it('returns the live registration for an opportunity (snake or camel)', () => {
        expect(GloweEvents.findRegistration(regs, 'o1').status).toBe('Accepted');
    });

    it('ignores cancelled/declined-only history and missing ids', () => {
        expect(GloweEvents.findRegistration(regs, 'o2')).toBeNull();
        expect(GloweEvents.findRegistration(regs, 'o3')).toBeNull();
        expect(GloweEvents.findRegistration(regs, null)).toBeNull();
    });
});

describe('organizer helpers', () => {
    const regs = [
        { status: 'Pending' }, { status: 'Accepted' }, { status: 'Accepted' },
        { status: 'Waitlisted' }, { status: 'Declined' }, { status: 'Cancelled' }
    ];

    it('canDecideRegistration is true only for Pending/Waitlisted', () => {
        expect(GloweEvents.canDecideRegistration('Pending')).toBe(true);
        expect(GloweEvents.canDecideRegistration('Waitlisted')).toBe(true);
        expect(GloweEvents.canDecideRegistration('Accepted')).toBe(false);
        expect(GloweEvents.canDecideRegistration('Declined')).toBe(false);
    });

    it('acceptedCount counts only Accepted rows', () => {
        expect(GloweEvents.acceptedCount(regs)).toBe(2);
        expect(GloweEvents.acceptedCount([])).toBe(0);
        expect(GloweEvents.acceptedCount(null)).toBe(0);
    });

    it('groupRegistrationsByStatus buckets by lowercased status', () => {
        const g = GloweEvents.groupRegistrationsByStatus(regs);
        expect(g.pending).toHaveLength(1);
        expect(g.accepted).toHaveLength(2);
        expect(g.waitlisted).toHaveLength(1);
        expect(g.declined).toHaveLength(1);
        expect(g.cancelled).toHaveLength(1);
    });

    it('capacityLabel reflects capacity and unlimited', () => {
        expect(GloweEvents.capacityLabel({ capacity: 5 }, 2)).toBe('2 / 5 spots');
        expect(GloweEvents.capacityLabel({ capacity: null }, 3)).toBe('Unlimited');
        expect(GloweEvents.capacityLabel({}, 0)).toBe('Unlimited');
    });
});

describe('event lifecycle helpers', () => {
    it('isEventCancelled reflects the event status', () => {
        expect(GloweEvents.isEventCancelled({ status: 'cancelled' })).toBe(true);
        expect(GloweEvents.isEventCancelled({ status: 'active' })).toBe(false);
        expect(GloweEvents.isEventCancelled(null)).toBe(false);
    });

    it('isDigital detects digital events (snake or camel)', () => {
        expect(GloweEvents.isDigital({ event_type: 'digital' })).toBe(true);
        expect(GloweEvents.isDigital({ eventType: 'digital' })).toBe(true);
        expect(GloweEvents.isDigital({ event_type: 'physical' })).toBe(false);
    });

    it('linkRevealHint only speaks for before_event digital links', () => {
        expect(GloweEvents.linkRevealHint({ event_type: 'digital', link_visibility: 'before_event', link_reveal_hours: 24 }))
            .toBe('The event link will appear 24h before the event.');
        expect(GloweEvents.linkRevealHint({ event_type: 'digital', link_visibility: 'before_event' }))
            .toBe('The event link will appear closer to the event.');
        expect(GloweEvents.linkRevealHint({ event_type: 'digital', link_visibility: 'immediate' })).toBe('');
        expect(GloweEvents.linkRevealHint({ event_type: 'physical' })).toBe('');
    });
});
