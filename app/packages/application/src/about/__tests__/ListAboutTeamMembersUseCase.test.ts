import { describe, it, expect } from 'vitest';
import { ListAboutTeamMembersUseCase } from '../ListAboutTeamMembersUseCase';
import type { IAboutRepository } from '../../ports/IAboutRepository';
import type { AboutTeamMember } from '@kc/domain';

function makeRepo(members: AboutTeamMember[]): IAboutRepository {
  return {
    listTeamMembers: async () => members,
  };
}

describe('ListAboutTeamMembersUseCase', () => {
  it('returns team members from the repository', async () => {
    const members: AboutTeamMember[] = [
      {
        roleKey: 'founder',
        sortOrder: 0,
        displayName: 'Nave',
        avatarUrl: 'https://example.com/a.jpg',
        shareHandle: 'nave',
      },
    ];
    const uc = new ListAboutTeamMembersUseCase(makeRepo(members));
    await expect(uc.execute()).resolves.toEqual(members);
  });

  it('returns an empty list when no members are configured', async () => {
    const uc = new ListAboutTeamMembersUseCase(makeRepo([]));
    await expect(uc.execute()).resolves.toEqual([]);
  });
});
