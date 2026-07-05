// GloWe adaptive create system helpers (FR-GLOWE-016 AC3/AC4/AC7).
//
// Pure, DOM-free logic for the account-type-aware "+ Create" menu: a
// declarative type registry plus the permission/menu-state computation and the
// per-type draft validators. Shared by the browser app (window.GloweCreate)
// and unit-tested via vitest (module.exports), so they must stay free of
// DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweCreate = api;
})(typeof self !== 'undefined' ? self : this, function () {
    // AC7 — modular type registry: adding a create type is one entry here.
    // `surface` names the Phase-B feature that persists the item; the DOM layer
    // dispatches on `id`.
    const GLOWE_CREATE_TYPES = [
        {
            id: 'post',
            label: 'Post',
            description: 'Share an update, a story, or knowledge with the community.',
            accountTypes: ['organization', 'individual'],
            surface: 'community'
        },
        {
            id: 'event',
            label: 'Event',
            description: 'Publish a volunteering event with a date and registration.',
            accountTypes: ['organization'],
            surface: 'opportunities'
        },
        {
            id: 'opportunity',
            label: 'Volunteer Opportunity',
            description: 'Recruit volunteers for an ongoing role or project.',
            accountTypes: ['organization'],
            surface: 'opportunities'
        },
        {
            id: 'need',
            label: 'Need',
            description: 'Ask the community for help, resources, or partners.',
            accountTypes: ['organization', 'individual'],
            surface: 'wishes'
        },
        {
            id: 'offer',
            label: 'Volunteer Offer',
            description: 'Offer your time and skills so organizations can find you.',
            accountTypes: ['individual'],
            surface: 'wishes'
        }
    ];

    // AC3 — compute the create-menu state for the current viewer.
    //   loggedIn: boolean; profile: { accountType, approvalStatus } | null.
    // Returns { state: 'anon' | 'unverified' | 'ok', types: [registry entries] }.
    // Members with no account type yet (onboarding skipped) get the individual
    // set — onboarding still enriches non-blockingly (FR-GLOWE-002 AC1).
    function createMenuState(loggedIn, profile) {
        if (!loggedIn) return { state: 'anon', types: [] };
        const p = profile || {};
        const accountType = p.accountType === 'organization' ? 'organization' : 'individual';
        if (accountType === 'organization' && p.approvalStatus !== 'approved') {
            return { state: 'unverified', types: [] };
        }
        return {
            state: 'ok',
            types: GLOWE_CREATE_TYPES.filter(function (t) {
                return t.accountTypes.indexOf(accountType) !== -1;
            })
        };
    }

    function findCreateType(id) {
        return GLOWE_CREATE_TYPES.find(function (t) { return t.id === id; }) || null;
    }

    // AC4 — event draft validation (an event is an opportunity + start date,
    // migration 0211). Required: title, start date; the date must parse and a
    // provided end must not precede the start.
    function validateEventDraft(draft) {
        const d = draft || {};
        if (!d.title || !String(d.title).trim()) return { valid: false, error: 'Please add an event title.' };
        if (!d.start_at) return { valid: false, error: 'Please choose a start date and time.' };
        const start = Date.parse(d.start_at);
        if (Number.isNaN(start)) return { valid: false, error: 'Please choose a valid start date.' };
        if (d.end_at) {
            const end = Date.parse(d.end_at);
            if (Number.isNaN(end) || end < start) return { valid: false, error: 'The end time must be after the start.' };
        }
        if (d.capacity !== undefined && d.capacity !== null && String(d.capacity) !== '') {
            const cap = Number(d.capacity);
            if (!Number.isInteger(cap) || cap <= 0) return { valid: false, error: 'Capacity must be a positive number.' };
        }
        return { valid: true, error: '' };
    }

    // AC4 — normalize an event draft into the glowe_opportunities insert shape.
    function normalizeEventDraft(draft) {
        const d = draft || {};
        const capacity = (d.capacity === undefined || d.capacity === null || String(d.capacity) === '')
            ? null : Number(d.capacity);
        return {
            title: String(d.title || '').trim(),
            organization: String(d.organization || '').trim(),
            field: d.field || 'Community',
            commitment: 'Event',
            location: String(d.location || '').trim(),
            duration: String(d.duration || '').trim(),
            description: String(d.description || '').trim(),
            skills: [],
            requirements: [],
            start_at: d.start_at ? new Date(d.start_at).toISOString() : null,
            end_at: d.end_at ? new Date(d.end_at).toISOString() : null,
            event_type: d.event_type === 'digital' ? 'digital' : 'physical',
            event_link: String(d.event_link || '').trim(),
            capacity: capacity,
            registration_mode: d.registration_mode === 'open' ? 'open' : 'gated'
        };
    }

    // AC4 — volunteer-offer draft validation (a standing offer of help,
    // post_type='offer', migration 0226). Required: title + description.
    function validateOfferPostDraft(draft) {
        const d = draft || {};
        if (!d.title || !String(d.title).trim()) return { valid: false, error: 'Please add a short headline for your offer.' };
        if (!d.text || !String(d.text).trim()) return { valid: false, error: 'Please describe what you can offer.' };
        return { valid: true, error: '' };
    }

    // AC4 — normalize a volunteer-offer draft into the glowe_posts insert shape.
    function normalizeOfferPostDraft(draft) {
        const d = draft || {};
        return {
            post_type: 'offer',
            title: String(d.title || '').trim(),
            text: String(d.text || '').trim(),
            impact_area: d.impact_area || null,
            category: 'offer',
            status: 'open',
            author_name: String(d.author_name || d.authorName || '').trim()
        };
    }

    // A glowe_posts row is a live volunteer offer (Wishing Well "Offers" rail).
    function isOpenOffer(row) {
        if (!row) return false;
        const type = row.post_type !== undefined ? row.post_type : row.postType;
        const status = row.status;
        return type === 'offer' && status === 'open';
    }

    return {
        GLOWE_CREATE_TYPES: GLOWE_CREATE_TYPES,
        createMenuState: createMenuState,
        findCreateType: findCreateType,
        validateEventDraft: validateEventDraft,
        normalizeEventDraft: normalizeEventDraft,
        validateOfferPostDraft: validateOfferPostDraft,
        normalizeOfferPostDraft: normalizeOfferPostDraft,
        isOpenOffer: isOpenOffer
    };
});
