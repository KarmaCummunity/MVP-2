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

    // ── Registration lifecycle (FR-GLOWE-007-C / -F) ────────────────────────
    // Maps a glowe_applications.status to a user-facing label.
    function registrationStatusLabel(status) {
        switch (status) {
            case 'Accepted': return 'Registered';
            case 'Pending': return 'Pending approval';
            case 'Waitlisted': return 'Waitlisted';
            case 'Declined': return 'Not accepted';
            case 'Cancelled': return 'Cancelled';
            default: return '';
        }
    }

    // A registration is active (occupies a spot / shown as live) unless the
    // registrant cancelled it or the organizer declined it.
    function isActiveRegistration(status) {
        return status === 'Accepted' || status === 'Pending' || status === 'Waitlisted';
    }

    // Only active registrations can be cancelled by the registrant.
    function canCancelRegistration(status) {
        return isActiveRegistration(status);
    }

    // Find the caller's live registration for an opportunity, ignoring
    // Cancelled/Declined history. Accepts snake- or camel-case id fields.
    function findRegistration(registrations, opportunityId) {
        if (!opportunityId) return null;
        const list = registrations || [];
        for (let i = 0; i < list.length; i += 1) {
            const r = list[i];
            const oppId = r && (r.opportunity_id || r.opportunityId);
            if (oppId === opportunityId && isActiveRegistration(r.status)) return r;
        }
        return null;
    }

    // ── Organizer portal (FR-GLOWE-007-E) ──────────────────────────────────
    // A registration is awaiting an organizer decision (accept / decline).
    function canDecideRegistration(status) {
        return status === 'Pending' || status === 'Waitlisted';
    }

    // Count registrations currently holding a confirmed spot.
    function acceptedCount(registrations) {
        return (registrations || []).filter(function (r) { return r && r.status === 'Accepted'; }).length;
    }

    // Group an organizer's registrations by status into ordered buckets.
    function groupRegistrationsByStatus(registrations) {
        const buckets = { pending: [], waitlisted: [], accepted: [], declined: [], cancelled: [] };
        (registrations || []).forEach(function (r) {
            const key = (r && r.status ? r.status : '').toLowerCase();
            if (buckets[key]) buckets[key].push(r);
        });
        return buckets;
    }

    // Capacity summary for an event given the confirmed count. Unlimited when
    // the event has no capacity set.
    function capacityLabel(event, accepted) {
        const cap = event && (event.capacity != null ? event.capacity : null);
        const used = typeof accepted === 'number' ? accepted : 0;
        if (cap == null) return 'Unlimited';
        return used + ' / ' + cap + ' spots';
    }

    return {
        isEvent: isEvent,
        eventTiming: eventTiming,
        isUpcoming: isUpcoming,
        eventTypeLabel: eventTypeLabel,
        formatEventDate: formatEventDate,
        filterEvents: filterEvents,
        sortByStart: sortByStart,
        registrationStatusLabel: registrationStatusLabel,
        isActiveRegistration: isActiveRegistration,
        canCancelRegistration: canCancelRegistration,
        findRegistration: findRegistration,
        canDecideRegistration: canDecideRegistration,
        acceptedCount: acceptedCount,
        groupRegistrationsByStatus: groupRegistrationsByStatus,
        capacityLabel: capacityLabel
    };
});
