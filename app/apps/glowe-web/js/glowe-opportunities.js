// GloWe Volunteer Network helpers (FR-GLOWE-007).
//
// Pure, DOM-free logic for publishing opportunities to glowe_opportunities.
// Shared by the browser app (window.GloweOpportunities) and unit-tested via
// vitest (module.exports), so they must stay free of DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweOpportunities = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function commaList(value) {
        if (Array.isArray(value)) return value.map(function (v) { return String(v).trim(); }).filter(Boolean);
        if (value === undefined || value === null) return [];
        return String(value).split(',').map(function (v) { return v.trim(); }).filter(Boolean);
    }

    // Validate a "Post an opportunity" draft. Required: title, field, commitment.
    function validateOpportunityDraft(draft) {
        const d = draft || {};
        if (!d.title || !String(d.title).trim()) return { valid: false, error: 'Please add an opportunity title.' };
        if (!d.field || !String(d.field).trim()) return { valid: false, error: 'Please choose an impact field.' };
        if (!d.commitment || !String(d.commitment).trim()) return { valid: false, error: 'Please choose an opportunity type.' };
        return { valid: true, error: '' };
    }

    // Normalize a draft into a glowe_opportunities insert payload. Free-text
    // skills/requirements become arrays; empty lists get friendly defaults so
    // published cards always render at least one tag.
    function normalizeOpportunityDraft(draft) {
        const d = draft || {};
        const skills = commaList(d.skills);
        const requirements = commaList(d.requirements);
        return {
            title: String(d.title || '').trim(),
            organization: String(d.organization || '').trim(),
            organization_en: String(d.organization_en || d.organizationEn || '').trim() || null,
            commitment: d.commitment || '',
            field: d.field || '',
            location: String(d.location || '').trim(),
            duration: String(d.duration || '').trim(),
            description: String(d.description || '').trim(),
            skills: skills.length ? skills : ['Community Support'],
            requirements: requirements.length ? requirements : ['Clear communication'],
            responsibilities: ['Coordinate next steps with interested community members']
        };
    }

    // True when `userId` already has an application for `opportunityId` in the
    // given list (FR-GLOWE-007 AC5 "Already applied" guard). Accepts both the
    // snake_case server shape (opportunity_id/user_id) and the camelCase local
    // cache shape (opportunityId/userId). Server rows are already user-scoped,
    // so a row without a user field counts as a match on opportunity alone.
    function isDuplicateApplication(list, opportunityId, userId) {
        if (!opportunityId) return false;
        return (list || []).some(function (app) {
            if (!app) return false;
            const oid = app.opportunity_id !== undefined ? app.opportunity_id : app.opportunityId;
            if (String(oid) !== String(opportunityId)) return false;
            const uid = app.user_id !== undefined ? app.user_id : app.userId;
            if (uid === undefined || uid === null || uid === '') return true;
            return String(uid) === String(userId);
        });
    }

    // FR-GLOWE-015 AC5 — admin-removed opportunities (status='removed') are
    // excluded from every public listing. Other statuses (active / cancelled /
    // closed) keep their existing surface-specific handling.
    function isListedOpportunity(row) {
        if (!row) return false;
        const status = row.status !== undefined ? row.status : 'active';
        return status !== 'removed';
    }

    return {
        commaList: commaList,
        validateOpportunityDraft: validateOpportunityDraft,
        normalizeOpportunityDraft: normalizeOpportunityDraft,
        isDuplicateApplication: isDuplicateApplication,
        isListedOpportunity: isListedOpportunity
    };
});
