// GloWe moderation & reporting helpers (FR-GLOWE-015).
//
// Pure, DOM-free logic for filing content reports (glowe_reports, migration
// 0226) and for the admin review queue. Shared by the browser app
// (window.GloweModeration) and unit-tested via vitest (module.exports), so
// they must stay free of DOM / Supabase / globals.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweModeration = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function field(row, snake, camel) {
        if (!row) return undefined;
        return row[snake] !== undefined ? row[snake] : row[camel];
    }

    // Report reasons — DB enum values (0226 CHECK) with user-facing labels.
    const REPORT_REASONS = [
        { value: 'spam', label: 'Spam or misleading promotion' },
        { value: 'harassment', label: 'Harassment or hate' },
        { value: 'misinformation', label: 'False or misleading information' },
        { value: 'inappropriate_content', label: 'Inappropriate content' },
        { value: 'fake_profile', label: 'Fake profile or impersonation' },
        { value: 'other', label: 'Other' }
    ];

    // Card-level target types → DB target_type. Wishes/offers are glowe_posts
    // rows, so they report as 'post'; anything unknown reports as 'general'.
    const TARGET_TYPE_ALIASES = {
        post: 'post',
        wish: 'post',
        offer: 'post',
        opportunity: 'opportunity',
        event: 'opportunity',
        profile: 'profile',
        comment: 'comment',
        thread: 'thread',
        reply: 'reply',
        general: 'general'
    };

    function canonicalTargetType(type) {
        return TARGET_TYPE_ALIASES[String(type || '').trim()] || 'general';
    }

    // Validate a report draft before persisting: a known reason is required.
    function validateReportDraft(draft) {
        const d = draft || {};
        const known = REPORT_REASONS.some(function (r) { return r.value === d.reason; });
        if (!known) return { valid: false, error: 'Please choose a reason.' };
        if (!d.targetId) return { valid: false, error: 'Missing report target.' };
        return { valid: true, error: '' };
    }

    // Build the glowe_reports insert payload (reporter_id is added server-side
    // by the backend adapter). Note text is trimmed and capped at 2000 chars.
    function buildReportPayload(draft) {
        const d = draft || {};
        return {
            target_type: canonicalTargetType(d.targetType),
            target_id: String(d.targetId == null ? '' : d.targetId),
            reason: String(d.reason || 'other'),
            note: String(d.note || '').trim().slice(0, 2000) || null
        };
    }

    // A unique-constraint violation on (reporter, target) means "you already
    // reported this" (23505 = unique_violation).
    function isDuplicateReportError(error) {
        if (!error) return false;
        if (error.code === '23505') return true;
        return /duplicate key/i.test(String(error.message || ''));
    }

    // Map a glowe_admin_list_reports row to the admin-queue view model.
    function mapAdminReportRow(row) {
        return {
            id: field(row, 'id', 'id'),
            reporterName: field(row, 'reporter_name', 'reporterName') || 'GloWe member',
            targetType: field(row, 'target_type', 'targetType') || 'general',
            targetId: field(row, 'target_id', 'targetId') || '',
            reason: field(row, 'reason', 'reason') || 'other',
            note: field(row, 'note', 'note') || '',
            status: field(row, 'status', 'status') || 'open',
            createdAt: field(row, 'created_at', 'createdAt') || ''
        };
    }

    function mapAdminReportRows(rows) {
        return (Array.isArray(rows) ? rows : []).map(mapAdminReportRow);
    }

    // Reports still awaiting a decision.
    function openReports(reports) {
        return (Array.isArray(reports) ? reports : []).filter(function (r) {
            return r && r.status === 'open';
        });
    }

    // Only posts and opportunities are removable in MVP (0226 RPC contract).
    function canRemoveTarget(targetType) {
        const t = canonicalTargetType(targetType);
        return t === 'post' || t === 'opportunity';
    }

    // Soft-removed content (status='removed') is excluded from all public
    // listings. Works for glowe_posts and glowe_opportunities rows alike.
    function isRemovedContent(row) {
        return Boolean(row) && field(row, 'status', 'status') === 'removed';
    }

    // Best-effort deep link from a report target to its public page, so the
    // admin can inspect what was reported. Returns '' when unknown.
    function reportTargetHref(report, basePath) {
        const base = String(basePath || '');
        const r = report || {};
        const id = encodeURIComponent(String(r.targetId || ''));
        if (!id) return '';
        if (r.targetType === 'opportunity') return base + 'pages/opportunity.html?id=' + id;
        if (r.targetType === 'profile') return base + 'pages/profile.html?id=' + id;
        if (r.targetType === 'post') return base + 'pages/community.html?post=' + id;
        return '';
    }

    return {
        REPORT_REASONS: REPORT_REASONS,
        canonicalTargetType: canonicalTargetType,
        validateReportDraft: validateReportDraft,
        buildReportPayload: buildReportPayload,
        isDuplicateReportError: isDuplicateReportError,
        mapAdminReportRow: mapAdminReportRow,
        mapAdminReportRows: mapAdminReportRows,
        openReports: openReports,
        canRemoveTarget: canRemoveTarget,
        isRemovedContent: isRemovedContent,
        reportTargetHref: reportTargetHref
    };
});
