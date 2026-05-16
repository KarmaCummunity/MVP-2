import { describe, it, expect } from 'vitest';
import { GetPostByIdUseCase } from '../GetPostByIdUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';

describe('GetPostByIdUseCase', () => {
  it('forwards postId + viewerId to the repo', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ postId: 'p_42' });
    const uc = new GetPostByIdUseCase(repo);

    const out = await uc.execute({ postId: 'p_42', viewerId: 'viewer_1' });

    expect(out.post?.postId).toBe('p_42');
    expect(repo.lastFindByIdArgs).toEqual({
      postId: 'p_42',
      viewerId: 'viewer_1',
      opts: { identityListingHostUserId: null },
    });
  });

  it('forwards identityListingHostUserId to the repo (D-31)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ postId: 'p_42' });
    const uc = new GetPostByIdUseCase(repo);

    await uc.execute({ postId: 'p_42', viewerId: 'v1', identityListingHostUserId: 'u_partner' });

    expect(repo.lastFindByIdArgs).toEqual({
      postId: 'p_42',
      viewerId: 'v1',
      opts: { identityListingHostUserId: 'u_partner' },
    });
  });

  it('returns post: null when the repo cannot find it', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new GetPostByIdUseCase(repo);

    const out = await uc.execute({ postId: 'missing', viewerId: null });
    expect(out.post).toBeNull();
  });
});
