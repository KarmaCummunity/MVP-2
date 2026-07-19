import { describe, it, expect } from 'vitest';
import {
    isProfileSparse,
    profileStatusChip,
    profileBioSource
} from '../glowe-profile-ux.js';

describe('isProfileSparse', () => {
    it('true when no bio and no focus', () => {
        expect(isProfileSparse({ about: '', focus: '' })).toBe(true);
        expect(isProfileSparse({})).toBe(true);
    });
    it('false when about OR focus present', () => {
        expect(isProfileSparse({ about: 'Hello', focus: '' })).toBe(false);
        expect(isProfileSparse({ about: '', focus: 'Education' })).toBe(false);
        expect(isProfileSparse({ shortLine: 'One line', focus: '' })).toBe(false);
        expect(isProfileSparse({ orgDescription: 'Org', orgField: '' })).toBe(false);
        expect(isProfileSparse({ about: '', orgField: 'Health' })).toBe(false);
    });
});

describe('profileStatusChip', () => {
    it('null for non-owner', () => {
        expect(profileStatusChip({ onboardingComplete: false }, { isOwner: false })).toBe(null);
    });
    it('onboarding incomplete wins', () => {
        const c = profileStatusChip({ onboardingComplete: false, about: 'x', focus: 'y' }, { isOwner: true });
        expect(c.kind).toBe('complete_profile');
        expect(c.action).toBe('onboarding');
    });
    it('org pending before sparse', () => {
        const c = profileStatusChip({
            onboardingComplete: true,
            accountType: 'organization',
            approvalStatus: 'pending',
            about: '',
            focus: ''
        }, { isOwner: true });
        expect(c.kind).toBe('pending_review');
        expect(c.action).toBe('none');
    });
    it('org rejected shows needs_changes', () => {
        const c = profileStatusChip({
            onboardingComplete: true,
            accountType: 'organization',
            approvalStatus: 'rejected'
        }, { isOwner: true });
        expect(c.kind).toBe('needs_changes');
        expect(c.action).toBe('edit');
    });
    it('sparse complete profile', () => {
        const c = profileStatusChip({
            onboardingComplete: true,
            accountType: 'individual',
            about: '',
            focus: ''
        }, { isOwner: true });
        expect(c.kind).toBe('complete_profile');
        expect(c.action).toBe('edit');
    });
    it('null when complete individual', () => {
        expect(profileStatusChip({
            onboardingComplete: true,
            about: 'Bio',
            focus: ''
        }, { isOwner: true })).toBe(null);
    });
});

describe('profileBioSource', () => {
    it('org prefers org_description', () => {
        expect(profileBioSource({
            accountType: 'organization',
            orgDescription: 'We plant trees',
            about: 'fallback'
        })).toEqual({ text: 'We plant trees', field: 'org_description' });
    });
    it('individual uses about', () => {
        expect(profileBioSource({
            accountType: 'individual',
            about: 'Hello',
            shortLine: 'ignored for field'
        })).toEqual({ text: 'Hello', field: 'about' });
    });
});
