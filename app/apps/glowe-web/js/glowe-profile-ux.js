// GloWe profile completion UX helpers (FR-GLOWE-011).
//
// Pure, DOM-free logic for sparse-profile detection, owner status chips, and
// bio source resolution. Shared by the browser app (window.GloweProfileUx) and
// unit-tested via vitest (module.exports).
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweProfileUx = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function trim(v) {
        return String(v == null ? '' : v).trim();
    }

    function bioText(p) {
        return trim(p.about) || trim(p.story) || trim(p.shortLine) || trim(p.orgDescription);
    }

    function focusText(p) {
        return trim(p.focus) || trim(p.orgField);
    }

    function isProfileSparse(profile) {
        const p = profile || {};
        return !bioText(p) && !focusText(p);
    }

    function profileStatusChip(profile, options) {
        const isOwner = Boolean(options && options.isOwner);
        if (!isOwner) return null;
        const p = profile || {};
        if (p.onboardingComplete !== true) {
            return {
                kind: 'complete_profile',
                label: 'Complete profile',
                action: 'onboarding'
            };
        }
        if (p.accountType === 'organization' && p.approvalStatus === 'pending') {
            return { kind: 'pending_review', label: 'Pending review', action: 'none' };
        }
        if (p.accountType === 'organization' && p.approvalStatus === 'rejected') {
            return { kind: 'needs_changes', label: 'Needs changes', action: 'edit' };
        }
        if (isProfileSparse(p)) {
            return {
                kind: 'complete_profile',
                label: 'Complete profile',
                action: 'edit'
            };
        }
        return null;
    }

    function profileBioSource(profile) {
        const p = profile || {};
        const isOrg = p.accountType === 'organization';
        if (isOrg && trim(p.orgDescription)) {
            return { text: trim(p.orgDescription), field: 'org_description' };
        }
        if (trim(p.about) || trim(p.story)) {
            return { text: trim(p.about) || trim(p.story), field: 'about' };
        }
        if (isOrg) {
            return { text: '', field: 'org_description' };
        }
        // Prefer about column for translate even if only shortLine is shown later
        return { text: trim(p.shortLine), field: 'about' };
    }

    const CAMERA_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

    const PENCIL_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

    const TRASH_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>';

    function projectOwnerActionsHtml(escapedProjectId) {
        return (
            '<div class="project-card-actions project-card-actions--icons">' +
            '<button type="button" class="project-icon-action" aria-label="Edit" onclick="openEditPersonalProjectModal(\'' + escapedProjectId + '\')">' +
            PENCIL_ICON_SVG + '</button>' +
            '<button type="button" class="project-icon-action project-icon-action--danger" aria-label="Delete" onclick="deletePersonalProject(\'' + escapedProjectId + '\')">' +
            TRASH_ICON_SVG + '</button>' +
            '</div>'
        );
    }

    return {
        isProfileSparse: isProfileSparse,
        profileStatusChip: profileStatusChip,
        profileBioSource: profileBioSource,
        CAMERA_ICON_SVG: CAMERA_ICON_SVG,
        projectOwnerActionsHtml: projectOwnerActionsHtml
    };
});
