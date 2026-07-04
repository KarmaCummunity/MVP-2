import { describe, it, expect } from 'vitest';
import GloweOpportunities from '../glowe-opportunities.js';

describe('commaList', () => {
    it('splits a comma string into trimmed, non-empty tokens', () => {
        expect(GloweOpportunities.commaList('Translation, facilitation ,  research ')).toEqual(['Translation', 'facilitation', 'research']);
    });

    it('passes arrays through and handles empty input', () => {
        expect(GloweOpportunities.commaList(['a', ' b '])).toEqual(['a', 'b']);
        expect(GloweOpportunities.commaList('')).toEqual([]);
        expect(GloweOpportunities.commaList(null)).toEqual([]);
    });
});

describe('validateOpportunityDraft', () => {
    it('requires title, field, and commitment', () => {
        expect(GloweOpportunities.validateOpportunityDraft({ title: 'T', field: 'community', commitment: 'Flexible' }).valid).toBe(true);
        expect(GloweOpportunities.validateOpportunityDraft({ title: '  ', field: 'community', commitment: 'Flexible' }).valid).toBe(false);
        expect(GloweOpportunities.validateOpportunityDraft({ title: 'T', field: '', commitment: 'Flexible' }).valid).toBe(false);
        expect(GloweOpportunities.validateOpportunityDraft({ title: 'T', field: 'community', commitment: '' }).valid).toBe(false);
        expect(GloweOpportunities.validateOpportunityDraft(null).valid).toBe(false);
    });

    it('returns a helpful error for the first missing field', () => {
        expect(GloweOpportunities.validateOpportunityDraft({}).error).toMatch(/title/i);
        expect(GloweOpportunities.validateOpportunityDraft({ title: 'T' }).error).toMatch(/impact field/i);
        expect(GloweOpportunities.validateOpportunityDraft({ title: 'T', field: 'community' }).error).toMatch(/opportunity type/i);
    });
});

describe('normalizeOpportunityDraft', () => {
    it('builds an insert payload with array skills/requirements', () => {
        const payload = GloweOpportunities.normalizeOpportunityDraft({
            title: '  Translator  ', organization: ' Org ', commitment: 'Flexible', field: 'education',
            location: ' Remote ', duration: 'Ongoing', description: ' Help translate ',
            skills: 'Hebrew, Arabic', requirements: 'Fluency'
        });
        expect(payload).toMatchObject({
            title: 'Translator', organization: 'Org', commitment: 'Flexible', field: 'education',
            location: 'Remote', duration: 'Ongoing', description: 'Help translate',
            skills: ['Hebrew', 'Arabic'], requirements: ['Fluency']
        });
        expect(payload.responsibilities).toHaveLength(1);
    });

    it('applies friendly defaults when skills/requirements are empty', () => {
        const payload = GloweOpportunities.normalizeOpportunityDraft({ title: 'T', field: 'community', commitment: 'Flexible' });
        expect(payload.skills).toEqual(['Community Support']);
        expect(payload.requirements).toEqual(['Clear communication']);
    });
});
