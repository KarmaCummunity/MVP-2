import { describe, it, expect } from 'vitest';
import { RepublishPostUseCase } from '../RepublishPostUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';

describe('RepublishPostUseCase', () => {
  it('republishes an expired owner post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'expired' });
    repo.republishResult = 'p_new';
    const uc = new RepublishPostUseCase(repo);

    const out = await uc.execute({ postId: 'p_old', ownerId: 'u_owner' });

    expect(out.newPostId).toBe('p_new');
    expect(repo.lastRepublishArgs).toEqual({ postId: 'p_old' });
  });

  it('rejects republish when post is missing', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new RepublishPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_x', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'republish_not_found',
    });
    expect(repo.lastRepublishArgs).toBeNull();
  });

  it('rejects republish by non-owner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_other', status: 'expired' });
    const uc = new RepublishPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_old', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'republish_not_owner',
    });
    expect(repo.lastRepublishArgs).toBeNull();
  });

  it('rejects republish when post is not expired', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new RepublishPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_old', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'republish_wrong_status',
    });
    expect(repo.lastRepublishArgs).toBeNull();
  });

  it('propagates repository errors (e.g. active_post_limit_exceeded)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'expired' });
    repo.republishError = Object.assign(new Error('active_post_limit_exceeded'), {
      code: 'active_post_limit_exceeded',
    });
    const uc = new RepublishPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_old', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'active_post_limit_exceeded',
    });
  });
});
