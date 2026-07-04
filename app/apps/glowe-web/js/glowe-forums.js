// GloWe Forums & Discussions helpers (FR-GLOWE-009).
//
// Pure, DOM-free logic for reading forum groups from glowe_forum_groups.
// Shared by the browser app (window.GloweForums) and unit-tested via vitest
// (module.exports), so they must stay free of DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweForums = api;
})(typeof self !== 'undefined' ? self : this, function () {
    // Map a glowe_forum_groups row to the shape the forum renderers consume.
    // members/posts/threads are not stored on the catalog row (live counts land
    // in later slices), so we default them to keep the mapped group a drop-in
    // replacement for the hardcoded discussionGroups fallback.
    function mapForumGroupRow(row) {
        const r = row || {};
        return {
            id: r.id == null ? '' : String(r.id),
            title: r.title || '',
            description: r.description || '',
            tags: Array.isArray(r.tags) ? r.tags : [],
            icon: r.icon || '',
            members: 0,
            posts: 0,
            threads: []
        };
    }

    // Map a list of catalog rows, dropping any without an id.
    function mapForumGroups(rows) {
        return (Array.isArray(rows) ? rows : [])
            .map(mapForumGroupRow)
            .filter(function (g) { return g.id !== ''; });
    }

    return {
        mapForumGroupRow: mapForumGroupRow,
        mapForumGroups: mapForumGroups
    };
});
