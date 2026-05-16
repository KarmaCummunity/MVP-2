import { describe, expect, it } from 'vitest';
import { UpsertPostActorIdentityUseCase } from '../UpsertPostActorIdentityUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('UpsertPostActorIdentityUseCase', () => {
  it('allows surface_visibility upgrades for an existing row', async () => {
    const repo = new FakePostRepository();
    repo.listPostActorIdentitiesResult = [
      {
        postId: 'p1',
        userId: 'u1',
        surfaceVisibility: 'OnlyMe',
        hideFromCounterparty: false,
      },
    ];
    const uc = new UpsertPostActorIdentityUseCase(repo);
    await uc.execute({
      postId: 'p1',
      userId: 'u1',
      surfaceVisibility: 'Public',
      hideFromCounterparty: false,
    });
    expect(repo.lastUpsertPostActorIdentityArgs?.surfaceVisibility).toBe('Public');
  });

  it('allows surface_visibility downgrades (Public → OnlyMe)', async () => {
    const repo = new FakePostRepository();
    repo.listPostActorIdentitiesResult = [
      {
        postId: 'p1',
        userId: 'u1',
        surfaceVisibility: 'Public',
        hideFromCounterparty: false,
      },
    ];
    const uc = new UpsertPostActorIdentityUseCase(repo);
    await uc.execute({
      postId: 'p1',
      userId: 'u1',
      surfaceVisibility: 'OnlyMe',
      hideFromCounterparty: false,
    });
    expect(repo.lastUpsertPostActorIdentityArgs?.surfaceVisibility).toBe('OnlyMe');
  });

  it('allows upsert when no identity row exists yet', async () => {
    const repo = new FakePostRepository();
    repo.listPostActorIdentitiesResult = [];
    const uc = new UpsertPostActorIdentityUseCase(repo);
    await uc.execute({
      postId: 'p1',
      userId: 'u1',
      surfaceVisibility: 'Public',
      hideFromCounterparty: true,
    });
    expect(repo.lastUpsertPostActorIdentityArgs?.surfaceVisibility).toBe('Public');
  });

});
