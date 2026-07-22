// GloWe follow helpers (FR-GLOWE-026) — pure, DOM-free.
// Mirrors KC GetFollowStateUseCase MVP subset + followMethods error codes.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweFollow = api;
})(typeof self !== 'undefined' ? self : this, function () {
    function buttonState(state, label, showNote) {
        return { state: state, label: label || '', showNote: !!showNote };
    }

    function deriveFromTarget(t) {
        if (String(t.accountStatus) !== 'active') return buttonState('unavailable');
        if (String(t.privacyMode) === 'Private') return buttonState('private_account', '', true);
        return buttonState('not_following_public', '+ Follow');
    }

    function deriveFromRaw(r) {
        const t = r.target;
        if (!t) return buttonState('unavailable');
        if (r.followingExists) return buttonState('following', 'Following ✓');
        return deriveFromTarget(t);
    }

    function deriveButtonState(raw, viewerId, targetUserId) {
        const me = String(viewerId || '');
        const target = String(targetUserId || '');
        if (!me || !target || me === target) return buttonState('self');
        return deriveFromRaw(raw || {});
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

    function trimName(value) {
        const s = value && String(value).trim();
        return s || '';
    }

    function pickDisplayName(g, p) {
        return trimName(g.name) || trimName(p.display_name) || 'GloWe member';
    }

    function mapFollowListRow(publicUser, gloweProfile) {
        const p = publicUser || {};
        const g = gloweProfile || {};
        const userId = String(g.id || p.user_id || '');
        return {
            userId: userId,
            name: pickDisplayName(g, p),
            avatarUrl: g.avatarUrl || p.avatar_url || '',
            profileHref: 'profile.html?id=' + encodeURIComponent(userId)
        };
    }

    function errorText(err) {
        const e = err || {};
        return String(e.message || '') + ' ' + String(e.details || '');
    }

    function isAlreadyFollowingError(err) {
        const e = err || {};
        const text = errorText(e);
        if (e.code === '23505' && text.indexOf('follow_edges_pkey') !== -1) return true;
        return text.indexOf('already_following') !== -1;
    }

    function mapFollowError(err) {
        const e = err || {};
        const text = errorText(e);
        if (isAlreadyFollowingError(e)) return { code: 'already_following', message: '' };
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
