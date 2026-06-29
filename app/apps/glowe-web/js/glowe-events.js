// GloWe event helpers (FR-GLOWE-007).
//
// Pure, DOM-free logic for the additive event model (migration 0211, D-66):
// an event is a glowe_opportunities row with start_at set. These helpers are
// shared by the browser app (window.GloweEvents) and unit-tested via vitest
// (module.exports), so they must stay free of DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweEvents = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function toTime(value) {
        if (!value) return NaN;
        const ms = value instanceof Date ? value.getTime() : Date.parse(value);
        return Number.isNaN(ms) ? NaN : ms;
    }

    // An opportunity is an event when it carries a start date.
    function isEvent(opp) {
        return Boolean(opp && (opp.startAt || opp.start_at));
    }

    function startTime(opp) {
        return toTime(opp && (opp.startAt || opp.start_at));
    }

    function endTime(opp) {
        return toTime(opp && (opp.endAt || opp.end_at));
    }

    // Classify an event relative to `nowMs` (default: now).
    //   'past'     — the event (or its start, if no end) is over
    //   'ongoing'  — started, has an end, and end is still in the future
    //   'upcoming' — starts in the future
    // Non-events and undated rows return null.
    function eventTiming(opp, nowMs) {
        if (!isEvent(opp)) return null;
        const now = typeof nowMs === 'number' ? nowMs : Date.now();
        const start = startTime(opp);
        const end = endTime(opp);
        if (Number.isNaN(start)) return null;
        if (!Number.isNaN(end)) {
            if (now < start) return 'upcoming';
            return now <= end ? 'ongoing' : 'past';
        }
        return now < start ? 'upcoming' : 'past';
    }

    function isUpcoming(opp, nowMs) {
        const timing = eventTiming(opp, nowMs);
        return timing === 'upcoming' || timing === 'ongoing';
    }

    function eventTypeLabel(type) {
        if (type === 'physical') return 'In person';
        if (type === 'digital') return 'Online';
        return '';
    }

    // Friendly date label for an event start. Returns '' for non-events.
    function formatEventDate(opp, locale) {
        const start = startTime(opp);
        if (Number.isNaN(start)) return '';
        const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        try {
            return new Date(start).toLocaleString(locale || undefined, opts);
        } catch (_e) {
            return new Date(start).toISOString();
        }
    }

    // Filter a list of opportunities to events matching the given controls.
    //   filters.type      — 'all' | 'physical' | 'digital'
    //   filters.timeframe — 'all' | 'upcoming' (upcoming includes ongoing)
    function filterEvents(list, filters, nowMs) {
        const f = filters || {};
        return (list || []).filter(function (opp) {
            if (!isEvent(opp)) return false;
            const type = opp.eventType || opp.event_type;
            if (f.type && f.type !== 'all' && type !== f.type) return false;
            if (f.timeframe === 'upcoming' && !isUpcoming(opp, nowMs)) return false;
            return true;
        });
    }

    // Sort events by soonest start first (stable for equal/invalid dates).
    function sortByStart(list) {
        return (list || []).slice().sort(function (a, b) {
            const sa = startTime(a);
            const sb = startTime(b);
            if (Number.isNaN(sa)) return Number.isNaN(sb) ? 0 : 1;
            if (Number.isNaN(sb)) return -1;
            return sa - sb;
        });
    }

    return {
        isEvent: isEvent,
        eventTiming: eventTiming,
        isUpcoming: isUpcoming,
        eventTypeLabel: eventTypeLabel,
        formatEventDate: formatEventDate,
        filterEvents: filterEvents,
        sortByStart: sortByStart
    };
});
