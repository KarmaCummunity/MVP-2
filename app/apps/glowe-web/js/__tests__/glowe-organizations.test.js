import { describe, it, expect } from 'vitest';
import GloweOrganizations from '../glowe-organizations.js';

const { mapProjectRow, mapProjects, isPublicProject, publicProjectsForUser } = GloweOrganizations;

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
