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

    // FR-GLOWE-011 AC5 — from a listOwned('posts') result, keep only the
    // caller's wish posts (post_type='wish', any status: open + fulfilled).
    // Mapping to the render shape is delegated to GloweWishes.mapWishRow so the
    // wish view model stays defined in one place.
    function myWishPosts(rows) {
        return (Array.isArray(rows) ? rows : []).filter(function (row) {
            return Boolean(row) && field(row, 'post_type', 'postType') === 'wish';
        });
    }

    // FR-GLOWE-011 AC4 (write) — validate a personal-project draft before it is
    // persisted via insertOwned('projects', …). glowe_projects.title is NOT NULL.
    function validateProjectDraft(input) {
        const draft = input || {};
        const title = String(draft.title || '').trim();
        if (title.length < 2) return { valid: false, error: 'Please add a project title.' };
        return { valid: true };
    }

    // FR-GLOWE-011 AC4 (edit) — locate an already-mapped project by id (string-safe)
    // so the Personal Area can pre-fill the edit modal. Returns undefined when the
    // id is missing or no project matches.
    function findProjectById(projects, id) {
        if (id === undefined || id === null || id === '') return undefined;
        return (Array.isArray(projects) ? projects : []).find(function (p) {
            return p && String(p.id) === String(id);
        });
    }

    // FR-GLOWE-011 AC4 (write) — normalize a draft into the glowe_projects insert
    // shape. `status` defaults to 'Draft' (mirrors the column default); trimming
    // keeps stray whitespace out of persisted rows.
    function buildProjectPayload(input) {
        const draft = input || {};
        return {
            title: String(draft.title || '').trim(),
            status: String(draft.status || '').trim() || 'Draft',
            description: String(draft.description || '').trim()
        };
    }

    // FR-GLOWE-011 AC7 — map a glowe_opportunities row (from listOwned, already
    // scoped to the caller) to the compact shape the Personal Area "My
    // Opportunities" list renders. Deliberately a small, purpose-built subset
    // (not the full volunteer-network card model) so the personal-area list
    // stays lean and this helper is unit-testable without app.js globals.
    function mapOwnedOpportunity(row) {
        return {
            id: field(row, 'id', 'id'),
            title: field(row, 'title', 'title') || '',
            field: field(row, 'field', 'field') || '',
            commitment: field(row, 'commitment', 'commitment') || '',
            location: field(row, 'location', 'location') || '',
            status: field(row, 'status', 'status') || 'active'
        };
    }

    function mapOwnedOpportunities(rows) {
        return (Array.isArray(rows) ? rows : []).map(mapOwnedOpportunity);
    }

    // FR-GLOWE-011 AC9 — build a { postId: title } lookup from a public posts
    // list (listAll('posts')) so offers can be enriched with the wish they
    // target. Rows missing an id are skipped; a missing title becomes ''.
    function postTitlesById(rows) {
        const out = {};
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
            const id = field(row, 'id', 'id');
            if (id === undefined || id === null || id === '') return;
            out[String(id)] = field(row, 'title', 'title') || '';
        });
        return out;
    }

    // FR-GLOWE-011 AC9 — map glowe_offers rows (from listOwned('offers'), already
    // scoped to the caller) to the compact shape the Personal Area "My Offers"
    // list renders, attaching the target wish's title from `titleById` when known.
    function mapOwnedOffer(row, titleById) {
        const wishId = field(row, 'post_id', 'postId');
        const titles = titleById || {};
        return {
            id: field(row, 'id', 'id'),
            wishId: wishId || '',
            wishTitle: (wishId !== undefined && wishId !== null && titles[String(wishId)]) || '',
            offerText: field(row, 'offer_text', 'offerText') || '',
            availability: field(row, 'availability', 'availability') || '',
            contactPreference: field(row, 'contact_preference', 'contactPreference') || ''
        };
    }

    function mapOwnedOffers(rows, titleById) {
        return (Array.isArray(rows) ? rows : []).map(function (row) {
            return mapOwnedOffer(row, titleById);
        });
    }

    // FR-GLOWE-011 AC8 — build a { opportunityId: opportunityRow } lookup from a
    // public opportunities list (listAll('opportunities')) so applications can be
    // enriched with the opportunity they target. Rows without an id are skipped.
    function opportunitiesById(rows) {
        const out = {};
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
            const id = field(row, 'id', 'id');
            if (id === undefined || id === null || id === '') return;
            out[String(id)] = row;
        });
        return out;
    }

    // FR-GLOWE-011 AC8 — map a glowe_applications row (volunteer application) to
    // the compact shape the Personal Area "Applications" list renders, attaching
    // the target opportunity's title + organization from `opportunityById`.
    function mapOwnedApplication(row, opportunityById) {
        const opps = opportunityById || {};
        const oppId = field(row, 'opportunity_id', 'opportunityId');
        const opp = (oppId !== undefined && oppId !== null) ? opps[String(oppId)] : undefined;
        return {
            id: field(row, 'id', 'id'),
            opportunityId: oppId || '',
            opportunityTitle: (opp && field(opp, 'title', 'title')) || '',
            organization: (opp && field(opp, 'organization', 'organization')) || '',
            status: field(row, 'status', 'status') || 'Pending',
            appliedAt: field(row, 'created_at', 'createdAt') || ''
        };
    }

    // FR-GLOWE-011 AC8 — from the caller's glowe_applications rows, keep only the
    // volunteer applications (the linked opportunity exists and is NOT an event —
    // event RSVPs live in the separate "My Events" section), enriched via
    // mapOwnedApplication. `isEvent` is injected (GloweEvents.isEvent) so this
    // helper stays DOM/module-free and unit-testable.
    function volunteerApplicationViews(rows, opportunityById, isEvent) {
        const opps = opportunityById || {};
        const isEventFn = typeof isEvent === 'function' ? isEvent : function () { return false; };
        const views = [];
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
            const oppId = field(row, 'opportunity_id', 'opportunityId');
            const opp = (oppId !== undefined && oppId !== null) ? opps[String(oppId)] : undefined;
            if (!opp || isEventFn(opp)) return;
            views.push(mapOwnedApplication(row, opps));
        });
        return views;
    }

    // FR-GLOWE-011 AC10 — guard the destructive "Delete Account" action: the
    // user must type the exact word DELETE (case-insensitive, trimmed) before the
    // profile-delete call is allowed to fire.
    function isDeleteAccountConfirmed(input) {
        return String(input || '').trim().toUpperCase() === 'DELETE';
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

    // FR-GLOWE-011 AC1 — decide whether the Personal Area profile card renders a
    // loading skeleton. Only while a backend profile fetch is in flight AND no
    // cached profile exists yet (first-ever load). Returning users with a cached
    // profile see it immediately (stale-while-revalidate) — no skeleton flash.
    function shouldShowProfileSkeleton(isLoading, hasCachedProfile) {
        return Boolean(isLoading) && !hasCachedProfile;
    }

    return {
        mapProjectRow: mapProjectRow,
        mapProjects: mapProjects,
        isPublicProject: isPublicProject,
        publicProjectsForUser: publicProjectsForUser,
        validateOutreachDraft: validateOutreachDraft,
        buildOutreachPayload: buildOutreachPayload,
        personalProjectsView: personalProjectsView,
        validateProjectDraft: validateProjectDraft,
        buildProjectPayload: buildProjectPayload,
        findProjectById: findProjectById,
        myWishPosts: myWishPosts,
        mapOwnedOpportunity: mapOwnedOpportunity,
        mapOwnedOpportunities: mapOwnedOpportunities,
        postTitlesById: postTitlesById,
        mapOwnedOffer: mapOwnedOffer,
        mapOwnedOffers: mapOwnedOffers,
        opportunitiesById: opportunitiesById,
        mapOwnedApplication: mapOwnedApplication,
        volunteerApplicationViews: volunteerApplicationViews,
        isDeleteAccountConfirmed: isDeleteAccountConfirmed,
        shouldShowProfileSkeleton: shouldShowProfileSkeleton
    };
});
