// GloWe follow helpers (FR-GLOWE-026) — pure, DOM-free.
// Mirrors KC GetFollowStateUseCase MVP subset + followMethods error codes.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweFollow = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function deriveButtonState(raw, viewerId, targetUserId) {
        const me = String(viewerId || '');
        const target = String(targetUserId || '');
        if (!me || !target || me === target) {
            return { state: 'self', label: '', showNote: false };
        }
        const r = raw || {};
        const t = r.target;
        if (!t) return { state: 'unavailable', label: '', showNote: false };
        if (r.followingExists) {
            return { state: 'following', label: 'Following ✓', showNote: false };
        }
        if (String(t.accountStatus) !== 'active') {
            return { state: 'unavailable', label: '', showNote: false };
        }
        if (String(t.privacyMode) === 'Private') {
            return { state: 'private_account', label: '', showNote: true };
        }
        return { state: 'not_following_public', label: '+ Follow', showNote: false };
    }

    function followButtonHtml(stateInfo, targetId) {
        const info = stateInfo || {};
        if (info.state === 'self' || info.state === 'private_account' || info.state === 'unavailable') {
            return '';
        }
        const id = String(targetId || '');
        const following = info.state === 'following';
        const cls = 'btn btn-outline btn-small follow-btn' + (following ? ' follow-btn--following' : '');
        const label = info.label || (following ? 'Following ✓' : '+ Follow');
        return '<button type="button" class="' + cls + '" data-follow-target="' + id +
            '" onclick="handleFollowToggle(\'' + id + '\')">' + label + '</button>';
    }

    function privateNoteHtml() {
        return '<p class="follow-private-note">This account requires approval to follow.</p>';
    }

    function connectionsPageUrl(userId, tab) {
        const t = (tab === 'following') ? 'following' : 'followers';
        return 'connections.html?user=' + encodeURIComponent(String(userId || '')) + '&tab=' + t;
    }

    function mapFollowListRow(publicUser, gloweProfile) {
        const p = publicUser || {};
        const g = gloweProfile || {};
        const userId = String(g.id || p.user_id || '');
        const name = (g.name && String(g.name).trim())
            || (p.display_name && String(p.display_name).trim())
            || 'GloWe member';
        return {
            userId: userId,
            name: name,
            avatarUrl: g.avatarUrl || p.avatar_url || '',
            profileHref: 'profile.html?id=' + encodeURIComponent(userId)
        };
    }

    function isAlreadyFollowingError(err) {
        const e = err || {};
        const text = String(e.message || '') + ' ' + String(e.details || '');
        if (e.code === '23505' && text.indexOf('follow_edges_pkey') !== -1) return true;
        return text.indexOf('already_following') !== -1;
    }

    function mapFollowError(err) {
        const e = err || {};
        const text = String(e.message || '') + ' ' + String(e.details || '');
        if (isAlreadyFollowingError(e)) {
            return { code: 'already_following', message: '' };
        }
        if (text.indexOf('blocked_relationship') !== -1 || e.code === '42501') {
            return { code: 'blocked_relationship', message: "Can't follow this profile" };
        }
        if (text.indexOf('self_follow') !== -1) {
            return { code: 'self_follow', message: "Can't follow this profile" };
        }
        return { code: 'unknown', message: 'Something went wrong' };
    }

    return {
        deriveButtonState: deriveButtonState,
        followButtonHtml: followButtonHtml,
        privateNoteHtml: privateNoteHtml,
        connectionsPageUrl: connectionsPageUrl,
        mapFollowListRow: mapFollowListRow,
        isAlreadyFollowingError: isAlreadyFollowingError,
        mapFollowError: mapFollowError
    };
});
