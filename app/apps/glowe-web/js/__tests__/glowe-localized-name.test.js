import { describe, it, expect } from 'vitest';
import GloweLocalizedName from '../glowe-localized-name.js';

const {
    isPrimarilyLatin,
    resolveLocalizedName,
    localizedProfileName,
    localizedAuthorName,
    localizedOrganizationName,
    englishNameOrCopy
} = GloweLocalizedName;

describe('isPrimarilyLatin', () => {
    it('treats empty as Latin (nothing to generate)', () => {
        expect(isPrimarilyLatin('')).toBe(true);
        expect(isPrimarilyLatin('   ')).toBe(true);
    });

    it('detects Latin names', () => {
        expect(isPrimarilyLatin('Naveh Arussi')).toBe(true);
        expect(isPrimarilyLatin('Open Heart NGO')).toBe(true);
        expect(isPrimarilyLatin('Jean-Luc')).toBe(true);
    });

    it('detects Hebrew / Arabic / Cyrillic', () => {
        expect(isPrimarilyLatin('נווה')).toBe(false);
        expect(isPrimarilyLatin('לב פתוח')).toBe(false);
        expect(isPrimarilyLatin('محمد')).toBe(false);
        expect(isPrimarilyLatin('Иван')).toBe(false);
    });
});

describe('resolveLocalizedName', () => {
    it('prefers English when lang is en', () => {
        expect(resolveLocalizedName('נווה', 'Naveh', 'en')).toBe('Naveh');
        expect(resolveLocalizedName('נווה', 'Naveh', 'en-US')).toBe('Naveh');
    });

    it('falls back to primary when English is missing', () => {
        expect(resolveLocalizedName('נווה', '', 'en')).toBe('נווה');
        expect(resolveLocalizedName('נווה', null, 'en')).toBe('נווה');
    });

    it('prefers primary for non-en languages', () => {
        expect(resolveLocalizedName('נווה', 'Naveh', 'he')).toBe('נווה');
        expect(resolveLocalizedName('', 'Naveh', 'he')).toBe('Naveh');
    });
});

describe('localizedProfileName', () => {
    it('uses org name pair for organizations', () => {
        const org = {
            accountType: 'organization',
            orgName: 'לב פתוח',
            orgNameEn: 'Open Heart',
            name: 'Contact'
        };
        expect(localizedProfileName(org, 'en')).toBe('Open Heart');
        expect(localizedProfileName(org, 'he')).toBe('לב פתוח');
    });

    it('uses person name pair for individuals', () => {
        const person = { accountType: 'individual', name: 'נווה', nameEn: 'Naveh' };
        expect(localizedProfileName(person, 'en')).toBe('Naveh');
        expect(localizedProfileName(person, 'he')).toBe('נווה');
    });

    it('falls back to defaults', () => {
        expect(localizedProfileName({ accountType: 'organization' }, 'en')).toBe('Organization');
        expect(localizedProfileName({}, 'en')).toBe('GloWe Member');
    });
});

describe('localizedAuthorName / localizedOrganizationName', () => {
    it('resolves author snapshots', () => {
        expect(localizedAuthorName({ authorName: 'נווה', authorNameEn: 'Naveh' }, 'en')).toBe('Naveh');
        expect(localizedAuthorName({ author_name: 'נווה', author_name_en: 'Naveh' }, 'he')).toBe('נווה');
        expect(localizedAuthorName({}, 'en', 'Anon')).toBe('Anon');
    });

    it('resolves organization snapshots', () => {
        expect(localizedOrganizationName(
            { organization: 'לב פתוח', organizationEn: 'Open Heart' },
            'en'
        )).toBe('Open Heart');
        expect(localizedOrganizationName(
            { organization: 'לב פתוח', organization_en: 'Open Heart' },
            'he'
        )).toBe('לב פתוח');
    });
});

describe('englishNameOrCopy', () => {
    it('keeps an explicit English value', () => {
        expect(englishNameOrCopy('נווה', 'Naveh')).toBe('Naveh');
    });

    it('copies a Latin primary when English is blank', () => {
        expect(englishNameOrCopy('Naveh', '')).toBe('Naveh');
    });

    it('returns empty when primary is non-Latin and English is blank', () => {
        expect(englishNameOrCopy('נווה', '')).toBe('');
    });
});

describe('profileNeedsEnglishName / applyEnglishNamePatches', () => {
    it('detects missing English for Hebrew org names', () => {
        expect(GloweLocalizedName.profileNeedsEnglishName({
            accountType: 'organization',
            orgName: 'יד תומכת',
            orgNameEn: ''
        })).toBe(true);
        expect(GloweLocalizedName.profileNeedsEnglishName({
            accountType: 'organization',
            orgName: 'יד תומכת',
            orgNameEn: 'Yad Tomechet'
        })).toBe(false);
        expect(GloweLocalizedName.profileNeedsEnglishName({
            accountType: 'organization',
            orgName: 'Open Heart',
            orgNameEn: ''
        })).toBe(false);
    });

    it('patches org and person English fields by id', () => {
        const patched = GloweLocalizedName.applyEnglishNamePatches(
            [
                { id: '1', accountType: 'organization', orgName: 'יד תומכת', orgNameEn: '' },
                { id: '2', accountType: 'individual', name: 'נווה', nameEn: '' }
            ],
            [
                { id: '1', orgNameEn: 'Yad Tomechet' },
                { id: '2', displayNameEn: 'Naveh' }
            ]
        );
        expect(patched[0].orgNameEn).toBe('Yad Tomechet');
        expect(patched[1].nameEn).toBe('Naveh');
    });
});
