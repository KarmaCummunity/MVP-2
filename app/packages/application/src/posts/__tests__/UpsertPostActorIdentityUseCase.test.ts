import { describe, expect, it } from 'vitest';
import { UpsertPostActorIdentityUseCase } from '../UpsertPostActorIdentityUseCase';
import { FakePostRepository } from './fakePostRepository';
import { PostError } from '../errors';

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

  it('rejects surface_visibility downgrades', async () => {
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
    await expect(
      uc.execute({
        postId: 'p1',
        userId: 'u1',
        surfaceVisibility: 'OnlyMe',
        hideFromCounterparty: false,
      }),
    ).rejects.toMatchObject({ name: 'PostError', code: 'visibility_downgrade_forbidden' });
  });

  it('treats missing row as Public baseline for upgrade checks', async () => {
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

  it('does not upsert when validation throws', async () => {
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
    try {
      await uc.execute({
        postId: 'p1',
        userId: 'u1',
        surfaceVisibility: 'OnlyMe',
        hideFromCounterparty: false,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(PostError);
    }
    expect(repo.lastUpsertPostActorIdentityArgs).toBeNull();
  });
});
