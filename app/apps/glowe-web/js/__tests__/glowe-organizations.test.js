import { describe, it, expect } from 'vitest';
import GloweOrganizations from '../glowe-organizations.js';

const {
    mapProjectRow,
    mapProjects,
    isPublicProject,
    publicProjectsForUser,
    validateOutreachDraft,
    buildOutreachPayload,
    personalProjectsView,
    validateProjectDraft,
    buildProjectPayload,
    myWishPosts,
    mapOwnedOpportunity,
    mapOwnedOpportunities
} = GloweOrganizations;

describe('mapProjectRow', () => {
    it('maps a snake_case glowe_projects row to the render shape', () => {
        const row = {
            id: 'p1',
            user_id: 'u1',
            title: 'Clean Water',
            description: 'Wells in rural areas',
            status: 'Active'
        };
        expect(mapProjectRow(row)).toEqual({
            id: 'p1',
            userId: 'u1',
            title: 'Clean Water',
            description: 'Wells in rural areas',
            status: 'Active'
        });
    });

    it('accepts camelCase fields as a fallback', () => {
        expect(mapProjectRow({ id: 'p2', userId: 'u2', title: 'T', description: 'D', status: 'Draft' }))
            .toMatchObject({ id: 'p2', userId: 'u2', status: 'Draft' });
    });

    it('supplies safe defaults for missing fields', () => {
        expect(mapProjectRow({ id: 'p3', user_id: 'u3' })).toEqual({
            id: 'p3',
            userId: 'u3',
            title: '',
            description: '',
            status: 'Active'
        });
    });
});

describe('mapProjects', () => {
    it('maps an array of rows', () => {
        const out = mapProjects([{ id: 'a', user_id: 'u', title: 'A', status: 'Active' }]);
        expect(out).toHaveLength(1);
        expect(out[0]).toMatchObject({ id: 'a', userId: 'u', title: 'A' });
    });

    it('returns an empty array for non-array input', () => {
        expect(mapProjects(null)).toEqual([]);
        expect(mapProjects(undefined)).toEqual([]);
    });
});

describe('isPublicProject', () => {
    it('is true for a matching user and non-draft status', () => {
        expect(isPublicProject({ userId: 'u1', status: 'Active' }, 'u1')).toBe(true);
    });

    it('is false when the user does not match', () => {
        expect(isPublicProject({ userId: 'u2', status: 'Active' }, 'u1')).toBe(false);
    });

    it('is false for draft projects (case-insensitive)', () => {
        expect(isPublicProject({ userId: 'u1', status: 'Draft' }, 'u1')).toBe(false);
        expect(isPublicProject({ userId: 'u1', status: 'draft' }, 'u1')).toBe(false);
    });

    it('is false when either project or userId is missing', () => {
        expect(isPublicProject(null, 'u1')).toBe(false);
        expect(isPublicProject({ userId: 'u1', status: 'Active' }, '')).toBe(false);
    });
});

describe('publicProjectsForUser', () => {
    const projects = [
        { id: 'a', userId: 'u1', status: 'Active' },
        { id: 'b', userId: 'u1', status: 'Draft' },
        { id: 'c', userId: 'u2', status: 'Active' },
        { id: 'd', userId: 'u1', status: 'Completed' }
    ];

    it('keeps only non-draft projects owned by the user', () => {
        expect(publicProjectsForUser(projects, 'u1').map(p => p.id)).toEqual(['a', 'd']);
    });

    it('returns an empty array for non-array input', () => {
        expect(publicProjectsForUser(null, 'u1')).toEqual([]);
    });
});

describe('validateOutreachDraft', () => {
    it('accepts a draft with a recipient and a message', () => {
        expect(validateOutreachDraft({ recipientId: 'u1', message: 'Hello there' }))
            .toEqual({ valid: true });
    });

    it('rejects a draft without a recipient', () => {
        expect(validateOutreachDraft({ message: 'Hello' })).toMatchObject({ valid: false });
    });

    it('rejects an empty or whitespace-only message', () => {
        expect(validateOutreachDraft({ recipientId: 'u1', message: '   ' })).toMatchObject({ valid: false });
        expect(validateOutreachDraft({ recipientId: 'u1' })).toMatchObject({ valid: false });
    });

    it('is safe with no input', () => {
        expect(validateOutreachDraft()).toMatchObject({ valid: false });
    });
});

describe('buildOutreachPayload', () => {
    it('builds a glowe_posts outreach row with the recipient in audience', () => {
        const payload = buildOutreachPayload({
            recipientId: 'org-1',
            orgName: 'Open Heart',
            message: '  We would love to collaborate.  '
        });
        expect(payload).toEqual({
            post_type: 'outreach',
            category: 'outreach',
            title: 'Reach-out to Open Heart',
            text: 'We would love to collaborate.',
            audience: 'org-1',
            status: 'sent',
            tags: []
        });
    });

    it('falls back to a generic title when orgName is missing', () => {
        expect(buildOutreachPayload({ recipientId: 'org-2', message: 'Hi' }).title).toBe('Reach-out');
    });

    it('is safe with no input', () => {
        const payload = buildOutreachPayload();
        expect(payload.post_type).toBe('outreach');
        expect(payload.audience).toBe('');
    });
});

describe('validateProjectDraft', () => {
    it('accepts a draft with a title', () => {
        expect(validateProjectDraft({ title: 'Clean Water' })).toEqual({ valid: true });
    });

    it('rejects an empty or whitespace-only title', () => {
        expect(validateProjectDraft({ title: '   ' })).toMatchObject({ valid: false });
        expect(validateProjectDraft({ description: 'no title' })).toMatchObject({ valid: false });
    });

    it('is safe with no input', () => {
        expect(validateProjectDraft()).toMatchObject({ valid: false });
    });
});

describe('buildProjectPayload', () => {
    it('trims fields and keeps the given status', () => {
        expect(buildProjectPayload({ title: '  Wells  ', status: 'Active', description: '  D  ' }))
            .toEqual({ title: 'Wells', status: 'Active', description: 'D' });
    });

    it('defaults status to Draft and description to empty', () => {
        expect(buildProjectPayload({ title: 'T' })).toEqual({ title: 'T', status: 'Draft', description: '' });
    });

    it('is safe with no input', () => {
        expect(buildProjectPayload()).toEqual({ title: '', status: 'Draft', description: '' });
    });
});

describe('myWishPosts', () => {
    const rows = [
        { id: 'w1', post_type: 'wish', status: 'open' },
        { id: 'c1', post_type: 'community' },
        { id: 'w2', post_type: 'wish', status: 'fulfilled' },
        { id: 'o1', post_type: 'outreach', status: 'sent' }
    ];

    it('keeps only wish posts, open and fulfilled alike', () => {
        expect(myWishPosts(rows).map(r => r.id)).toEqual(['w1', 'w2']);
    });

    it('excludes community and outreach posts', () => {
        const ids = myWishPosts(rows).map(r => r.id);
        expect(ids).not.toContain('c1');
        expect(ids).not.toContain('o1');
    });

    it('accepts camelCase postType as a fallback', () => {
        expect(myWishPosts([{ id: 'w3', postType: 'wish' }]).map(r => r.id)).toEqual(['w3']);
    });

    it('returns an empty array for non-array input', () => {
        expect(myWishPosts(null)).toEqual([]);
        expect(myWishPosts(undefined)).toEqual([]);
    });
});

describe('personalProjectsView', () => {
    const backend = [{ id: 'b1' }];
    const local = [{ id: 'l1' }, { id: 'l2' }];

    it('prefers the backend list once it has loaded', () => {
        expect(personalProjectsView(backend, local)).toBe(backend);
    });

    it('trusts an empty backend list over the local fallback (real empty state)', () => {
        expect(personalProjectsView([], local)).toEqual([]);
    });

    it('falls back to the local list while the backend is still null', () => {
        expect(personalProjectsView(null, local)).toBe(local);
    });

    it('returns an empty array when both are unavailable', () => {
        expect(personalProjectsView(null, null)).toEqual([]);
    });
});

describe('mapOwnedOpportunity', () => {
    it('maps a snake_case glowe_opportunities row to the compact shape', () => {
        const row = {
            id: 'op1', title: 'Beach cleanup', field: 'Environment',
            commitment: 'One-time', location: 'Haifa', status: 'active'
        };
        expect(mapOwnedOpportunity(row)).toEqual({
            id: 'op1', title: 'Beach cleanup', field: 'Environment',
            commitment: 'One-time', location: 'Haifa', status: 'active'
        });
    });

    it('defaults status to "active" and missing strings to empty', () => {
        expect(mapOwnedOpportunity({ id: 'op2' })).toEqual({
            id: 'op2', title: '', field: '', commitment: '', location: '', status: 'active'
        });
    });
});

describe('mapOwnedOpportunities', () => {
    it('maps a row list, preserving order', () => {
        const rows = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
        expect(mapOwnedOpportunities(rows).map(o => o.id)).toEqual(['a', 'b']);
    });

    it('returns an empty array for non-array input', () => {
        expect(mapOwnedOpportunities(null)).toEqual([]);
        expect(mapOwnedOpportunities(undefined)).toEqual([]);
    });
});
