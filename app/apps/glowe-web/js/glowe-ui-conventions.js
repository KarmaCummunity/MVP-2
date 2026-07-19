// GloWe UI conventions — shared card chrome (FR-TRANSLATE-005 / FR-GLOWE-*).
//
// Keep visual contracts in one place so every surface (org, post, wish,
// opportunity, comment) places translation toggles and action rows the same way.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GloweUiConventions = api;
})(typeof self !== 'undefined' ? self : this, function () {
    // Reserved slot for the "Show original" / "Show translation" control.
    // Place immediately under the card header / author row, before title/body.
    function translationToggleSlotHtml() {
        return '<div class="tr-slot" aria-live="polite"></div>';
    }

    // Stable action-row class: CSS grid keeps View / primary / Save aligned
    // whether the save label is "Save" or "Saved".
    function cardActionsClass() {
        return 'card-actions card-actions--consistent';
    }

    // Short save labels so org/opportunity footers share one layout.
    const SAVE_LABELS = {
        profile: 'Save',
        post: 'Save',
        opportunity: 'Save',
        wish: 'Save',
        saved: 'Saved'
    };

    function saveLabelFor(kind) {
        return SAVE_LABELS[kind] || 'Save';
    }

    // Drop duplicate adjacent meta chips (e.g. location === scope → "Israel Israel").
    function uniqueMeta(values) {
        const seen = {};
        const out = [];
        (values || []).forEach(function (raw) {
            const v = String(raw == null ? '' : raw).trim();
            if (!v) return;
            const key = v.toLowerCase();
            if (seen[key]) return;
            seen[key] = true;
            out.push(v);
        });
        return out;
    }

    return {
        translationToggleSlotHtml: translationToggleSlotHtml,
        cardActionsClass: cardActionsClass,
        saveLabelFor: saveLabelFor,
        uniqueMeta: uniqueMeta,
        SAVE_LABELS: SAVE_LABELS
    };
});
