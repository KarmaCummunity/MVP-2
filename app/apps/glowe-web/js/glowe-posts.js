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

    // Split a comma string into trimmed, non-empty tokens (arrays pass through).
    function commaList(value) {
        if (Array.isArray(value)) return value.map(function (v) { return String(v).trim(); }).filter(Boolean);
        if (value === undefined || value === null) return [];
        return String(value).split(',').map(function (v) { return v.trim(); }).filter(Boolean);
    }

    // Validate a "Write a post" draft. Required: title + text/body.
    function validatePostDraft(draft) {
        const d = draft || {};
        if (!d.title || !String(d.title).trim()) return { valid: false, error: 'Please add a post title.' };
        const body = d.text !== undefined ? d.text : d.body;
        if (!body || !String(body).trim()) return { valid: false, error: 'Please write something to share.' };
        return { valid: true, error: '' };
    }

    // Normalize a draft into a glowe_posts insert payload (post_type='community').
    // Free-text tags become an array; blank optional fields collapse to ''.
    function normalizePostDraft(draft) {
        const d = draft || {};
        return {
            post_type: 'community',
            title: String(d.title || '').trim(),
            category: String(d.category || '').trim(),
            text: String((d.text !== undefined ? d.text : d.body) || '').trim(),
            tags: commaList(d.tags),
            audience: String(d.audience || '').trim(),
            language: String(d.language || '').trim(),
            link: String(d.link || '').trim(),
            author_name: String(d.author_name || d.authorName || '').trim()
        };
    }

    // True when `userId` authored `post` (owner-only delete CTA, FR-GLOWE-008
    // AC7). A blank/absent viewer id never matches, so guests and non-owners
    // never see the control.
    function isPostOwner(post, userId) {
        if (!post || userId === undefined || userId === null || userId === '') return false;
        return String(post.authorId) === String(userId);
    }

    return {
        isCommunityPost: isCommunityPost,
        mapPostRow: mapPostRow,
        mapCommunityRows: mapCommunityRows,
        commaList: commaList,
        validatePostDraft: validatePostDraft,
        normalizePostDraft: normalizePostDraft,
        isPostOwner: isPostOwner
    };
});
