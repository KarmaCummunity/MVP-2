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
