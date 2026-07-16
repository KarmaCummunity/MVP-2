// GloWe bilingual display names (FR-GLOWE-024).
//
// Proper names are NOT routed through the UGC translation cache
// (FR-TRANSLATE-005 AC4). Instead each person/org stores an English variant
// (display_name_en / org_name_en) and content snapshots stamp author_name_en /
// organization_en at create time. This module picks the right variant for the
// reader's interface language.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweLocalizedName = api;
})(typeof self !== 'undefined' ? self : this, function () {
    // Non-Latin letter scripts that need an English variant.
    const NON_LATIN = /[\u0590-\u05FF\u0600-\u06FF\u0400-\u04FF\u0370-\u03FF\u4E00-\u9FFF]/;

    function trim(value) {
        return String(value == null ? '' : value).trim();
    }

    // True when the text has no Hebrew/Arabic/Cyrillic/Greek/CJK letters.
    function isPrimarilyLatin(text) {
        const t = trim(text);
        if (!t) return true;
        return !NON_LATIN.test(t);
    }

    // Reader language: EN prefers the English column; otherwise the primary
    // (source) name. Always falls back to whichever is non-empty.
    function resolveLocalizedName(primary, english, lang) {
        const p = trim(primary);
        const e = trim(english);
        if (String(lang || '').toLowerCase().split('-')[0] === 'en') {
            return e || p || '';
        }
        return p || e || '';
    }

    // Person vs organization display name from a fromProfileRow-shaped profile.
    function localizedProfileName(profile, lang) {
        const p = profile || {};
        const isOrg = p.accountType === 'organization';
        if (isOrg) {
            return resolveLocalizedName(
                p.orgName || p.name,
                p.orgNameEn || p.nameEn,
                lang
            ) || 'Organization';
        }
        return resolveLocalizedName(p.name, p.nameEn, lang) || 'GloWe Member';
    }

    // Author snapshot on a post/wish card (primary + optional English).
    function localizedAuthorName(row, lang, fallback) {
        const r = row || {};
        const primary = r.authorName != null ? r.authorName : r.author_name;
        const english = r.authorNameEn != null ? r.authorNameEn : r.author_name_en;
        return resolveLocalizedName(primary, english, lang) || fallback || 'Community Member';
    }

    // Organization snapshot on an opportunity card.
    function localizedOrganizationName(row, lang, fallback) {
        const r = row || {};
        const primary = r.organization;
        const english = r.organizationEn != null ? r.organizationEn : r.organization_en;
        return resolveLocalizedName(primary, english, lang) || fallback || 'GloWe Member';
    }

    // When English is blank and the primary is already Latin, copy it.
    function englishNameOrCopy(primary, english) {
        const e = trim(english);
        if (e) return e;
        const p = trim(primary);
        if (p && isPrimarilyLatin(p)) return p;
        return '';
    }

    return {
        isPrimarilyLatin: isPrimarilyLatin,
        resolveLocalizedName: resolveLocalizedName,
        localizedProfileName: localizedProfileName,
        localizedAuthorName: localizedAuthorName,
        localizedOrganizationName: localizedOrganizationName,
        englishNameOrCopy: englishNameOrCopy
    };
});
