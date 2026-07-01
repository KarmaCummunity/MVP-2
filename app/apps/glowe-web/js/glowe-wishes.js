// GloWe Wishing Well helpers (FR-GLOWE-006).
//
// Pure, DOM-free logic for the live needs board: a wish is a glowe_posts row
// with post_type='wish' (migration 0215). These helpers are shared by the
// browser app (window.GloweWishes) and unit-tested via vitest (module.exports),
// so they must stay free of DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweWishes = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function field(row, snake, camel) {
        if (!row) return undefined;
        return row[snake] !== undefined ? row[snake] : row[camel];
    }

    // A post is a live wish when it is typed 'wish' and still open.
    function isOpenWish(row) {
        return Boolean(row)
            && field(row, 'post_type', 'postType') === 'wish'
            && field(row, 'status', 'status') === 'open';
    }

    function formatWishTime(value) {
        if (!value) return '';
        const ms = value instanceof Date ? value.getTime() : Date.parse(value);
        if (Number.isNaN(ms)) return '';
        try {
            return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (_e) {
            return new Date(ms).toISOString().slice(0, 10);
        }
    }

    // Map a glowe_posts row to the wish view model the board renders. glowe_posts
    // has no location column (0215), so location is best-effort from raw fields.
    function mapWishRow(row) {
        const area = field(row, 'impact_area', 'impactArea');
        return {
            id: field(row, 'id', 'id'),
            type: field(row, 'wish_type', 'wishType') || 'Open Call',
            title: field(row, 'title', 'title') || '',
            description: field(row, 'text', 'text') || '',
            author: field(row, 'author_name', 'authorName') || 'GloWe Member',
            authorId: field(row, 'user_id', 'userId') || field(row, 'author_id', 'authorId') || '',
            location: row && (row.location || '') || '',
            areas: area ? [area] : [],
            time: formatWishTime(field(row, 'created_at', 'createdAt'))
        };
    }

    // Filter mapped wishes by the board's controls.
    //   filters.type     — 'all' | <wish_type>
    //   filters.area     — 'all' | <impact_area>
    //   filters.location — substring match (case-insensitive)
    function filterWishes(list, filters) {
        const f = filters || {};
        return (list || []).filter(function (wish) {
            if (f.type && f.type !== 'all' && wish.type !== f.type) return false;
            if (f.area && f.area !== 'all' && (wish.areas || []).indexOf(f.area) === -1) return false;
            if (f.location && (wish.location || '').toLowerCase().indexOf(f.location.toLowerCase()) === -1) return false;
            return true;
        });
    }

    // Hero stats computed from the live wish list.
    function wishStats(list) {
        const wishes = list || [];
        const areas = {};
        wishes.forEach(function (w) {
            (w.areas || []).forEach(function (a) { if (a) areas[a] = true; });
        });
        return { openWishes: wishes.length, impactAreas: Object.keys(areas).length };
    }

    return {
        isOpenWish: isOpenWish,
        mapWishRow: mapWishRow,
        filterWishes: filterWishes,
        wishStats: wishStats,
        formatWishTime: formatWishTime
    };
});
