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

    // Map a glowe_forum_threads row to the shape the thread renderers consume.
    // replies is a live aggregate delivered in a later slice; default 0 here.
    function mapForumThreadRow(row) {
        const r = row || {};
        return {
            id: r.id == null ? '' : String(r.id),
            groupId: r.group_id || '',
            authorId: r.user_id || '',
            title: r.title || '',
            body: r.body || '',
            createdAt: r.created_at || '',
            replies: 0
        };
    }

    // Map a list of thread rows, dropping any without an id. listAll already
    // orders newest-first (created_at DESC), so order is preserved as-is.
    function mapForumThreads(rows) {
        return (Array.isArray(rows) ? rows : [])
            .map(mapForumThreadRow)
            .filter(function (t) { return t.id !== ''; });
    }

    // Threads belonging to one group, order preserved.
    function threadsForGroup(threads, groupId) {
        return (Array.isArray(threads) ? threads : [])
            .filter(function (t) { return t && t.groupId === groupId; });
    }

    // Map a glowe_forum_replies row to the shape the reply renderer consumes.
    function mapForumReplyRow(row) {
        const r = row || {};
        return {
            id: r.id == null ? '' : String(r.id),
            threadId: r.thread_id || '',
            authorId: r.user_id || '',
            body: r.body || '',
            createdAt: r.created_at || ''
        };
    }

    // Map a list of reply rows, dropping any without an id. listAll is called
    // with ascending created_at so replies read oldest-first (conversation flow).
    function mapForumReplies(rows) {
        return (Array.isArray(rows) ? rows : [])
            .map(mapForumReplyRow)
            .filter(function (r) { return r.id !== ''; });
    }

    // Replies belonging to one thread, order preserved.
    function repliesForThread(replies, threadId) {
        return (Array.isArray(replies) ? replies : [])
            .filter(function (r) { return r && r.threadId === threadId; });
    }

    // Count replies per thread id → { [threadId]: count }. Used for the live
    // AC7 reply-count aggregate on each thread card.
    function countRepliesByThread(replies) {
        return (Array.isArray(replies) ? replies : []).reduce(function (acc, r) {
            if (r && r.threadId) acc[r.threadId] = (acc[r.threadId] || 0) + 1;
            return acc;
        }, {});
    }

    // Post count per group id (= number of threads in that group) → { [groupId]: count }.
    function groupThreadCounts(threads) {
        return (Array.isArray(threads) ? threads : []).reduce(function (acc, t) {
            if (t && t.groupId) acc[t.groupId] = (acc[t.groupId] || 0) + 1;
            return acc;
        }, {});
    }

    // Distinct member count per group id: authors of a thread OR a reply in that
    // group → { [groupId]: count }. Replies map to a group via their thread's
    // groupId (built from `threads`). Empty author ids (offline mirror) are skipped.
    function groupMemberCounts(threads, replies) {
        const threadList = Array.isArray(threads) ? threads : [];
        const threadGroup = threadList.reduce(function (acc, t) {
            if (t && t.id) acc[t.id] = t.groupId || '';
            return acc;
        }, {});
        const sets = {};
        function add(groupId, authorId) {
            if (!groupId || !authorId) return;
            (sets[groupId] = sets[groupId] || new Set()).add(authorId);
        }
        threadList.forEach(function (t) { if (t) add(t.groupId, t.authorId); });
        (Array.isArray(replies) ? replies : []).forEach(function (r) {
            if (r) add(threadGroup[r.threadId], r.authorId);
        });
        return Object.keys(sets).reduce(function (acc, groupId) {
            acc[groupId] = sets[groupId].size;
            return acc;
        }, {});
    }

    return {
        mapForumGroupRow: mapForumGroupRow,
        mapForumGroups: mapForumGroups,
        mapForumThreadRow: mapForumThreadRow,
        mapForumThreads: mapForumThreads,
        threadsForGroup: threadsForGroup,
        mapForumReplyRow: mapForumReplyRow,
        mapForumReplies: mapForumReplies,
        repliesForThread: repliesForThread,
        countRepliesByThread: countRepliesByThread,
        groupThreadCounts: groupThreadCounts,
        groupMemberCounts: groupMemberCounts
    };
});
