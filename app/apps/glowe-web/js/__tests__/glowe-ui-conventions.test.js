import { describe, it, expect } from 'vitest';
import GloweUiConventions from '../glowe-ui-conventions.js';

describe('GloweUiConventions', () => {
    it('exposes a reserved translation toggle slot', () => {
        expect(GloweUiConventions.translationToggleSlotHtml()).toContain('tr-slot');
    });

    it('uses a stable card-actions class', () => {
        expect(GloweUiConventions.cardActionsClass()).toContain('card-actions--consistent');
    });

    it('shortens save labels', () => {
        expect(GloweUiConventions.saveLabelFor('profile')).toBe('Save');
        expect(GloweUiConventions.SAVE_LABELS.saved).toBe('Saved');
    });

    it('dedupes meta chips case-insensitively', () => {
        expect(GloweUiConventions.uniqueMeta(['Israel', 'israel', 'Global']))
            .toEqual(['Israel', 'Global']);
        expect(GloweUiConventions.uniqueMeta(['Health', 'Health', '']))
            .toEqual(['Health']);
    });
});
