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

    return {
        mapProjectRow: mapProjectRow,
        mapProjects: mapProjects,
        isPublicProject: isPublicProject,
        publicProjectsForUser: publicProjectsForUser
    };
});
