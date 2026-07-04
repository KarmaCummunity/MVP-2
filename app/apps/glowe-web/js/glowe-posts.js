// GloWe Community Feed helpers (FR-GLOWE-008).
//
// Pure, DOM-free logic for reading community posts from glowe_posts
// (post_type='community'). Shared by the browser app (window.GlowePosts) and
// unit-tested via vitest (module.exports), so they must stay free of DOM /
// Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GlowePosts = api;
})(typeof self !== 'undefined' ? self : this, function () {
    // True when a glowe_posts row belongs on the community feed. Wishes carry
    // post_type='wish'; community posts carry 'community' or (legacy rows) no
    // post_type at all, which we treat as community.
    function isCommunityPost(row) {
        if (!row) return false;
        if (row.post_type === undefined || row.post_type === null || row.post_type === '') return true;
        return row.post_type === 'community';
    }

    // Map a glowe_posts row to the shape the feed renderer consumes.
    function mapPostRow(row) {
        const r = row || {};
        return {
            id: r.id,
            title: r.title || '',
            category: r.category || '',
            text: r.text || '',
            tags: Array.isArray(r.tags) ? r.tags : [],
            authorId: r.user_id || '',
            authorName: r.author_name || 'Community Member',
            createdAt: r.created_at || ''
        };
    }

    // Filter a raw row list to community posts and map each to the feed shape.
    function mapCommunityRows(rows) {
        return (rows || []).filter(isCommunityPost).map(mapPostRow);
    }

    return {
        isCommunityPost: isCommunityPost,
        mapPostRow: mapPostRow,
        mapCommunityRows: mapCommunityRows
    };
});
