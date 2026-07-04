// GloWe Organizations / public-profile helpers (FR-GLOWE-010).
//
// Pure, DOM-free logic for the public profile page's projects list (AC5):
// a project is a glowe_projects row (id, user_id, title, status, description).
// These helpers are shared by the browser app (window.GloweOrganizations) and
// unit-tested via vitest (module.exports), so they must stay free of DOM /
// Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweOrganizations = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function field(row, snake, camel) {
        if (!row) return undefined;
        return row[snake] !== undefined ? row[snake] : row[camel];
    }

    // Map a glowe_projects row to the view model renderProjectCard expects.
    function mapProjectRow(row) {
        return {
            id: field(row, 'id', 'id'),
            userId: field(row, 'user_id', 'userId') || '',
            title: field(row, 'title', 'title') || '',
            description: field(row, 'description', 'description') || '',
            status: field(row, 'status', 'status') || 'Active'
        };
    }

    function mapProjects(rows) {
        return (Array.isArray(rows) ? rows : []).map(mapProjectRow);
    }

    // A project is publicly visible on a profile when it belongs to that user
    // and is not still a draft (status !== 'Draft', case-insensitive).
    function isPublicProject(project, userId) {
        if (!project || !userId) return false;
        if (String(project.userId) !== String(userId)) return false;
        return String(project.status || '').toLowerCase() !== 'draft';
    }

    // Filter already-mapped projects down to the public ones for a given user.
    function publicProjectsForUser(projects, userId) {
        return (Array.isArray(projects) ? projects : []).filter(function (p) {
            return isPublicProject(p, userId);
        });
    }

    // AC6 — validate a "Reach out" contact draft before it is persisted.
    function validateOutreachDraft(input) {
        const draft = input || {};
        if (!draft.recipientId) return { valid: false, error: 'Missing recipient.' };
        const message = String(draft.message || '').trim();
        if (message.length < 2) return { valid: false, error: 'Please write a short message.' };
        return { valid: true };
    }

    // AC6 — build the glowe_posts row for a Phase-B outreach post. The recipient
    // is encoded in `audience` so a later Phase-C DM migration can resolve the
    // conversation; visibility scoping (sender + recipient) is deferred to RLS.
    function buildOutreachPayload(input) {
        const draft = input || {};
        const orgName = String(draft.orgName || '').trim();
        return {
            post_type: 'outreach',
            category: 'outreach',
            title: orgName ? ('Reach-out to ' + orgName) : 'Reach-out',
            text: String(draft.message || '').trim(),
            audience: String(draft.recipientId || ''),
            status: 'sent',
            tags: []
        };
    }

    // FR-GLOWE-011 AC4 — decide which project list the Personal Area renders.
    // Once a backend load has completed we trust it (even when empty, so a user
    // with no real projects sees an empty state rather than the demo/local
    // fallback). While the backend list is still null (offline or pre-load),
    // fall back to the local/offline cache.
    function personalProjectsView(backendList, localList) {
        if (Array.isArray(backendList)) return backendList;
        return Array.isArray(localList) ? localList : [];
    }

    return {
        mapProjectRow: mapProjectRow,
        mapProjects: mapProjects,
        isPublicProject: isPublicProject,
        publicProjectsForUser: publicProjectsForUser,
        validateOutreachDraft: validateOutreachDraft,
        buildOutreachPayload: buildOutreachPayload,
        personalProjectsView: personalProjectsView
    };
});
