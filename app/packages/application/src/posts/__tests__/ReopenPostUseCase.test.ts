import { describe, it, expect } from 'vitest';
import { ReopenPostUseCase } from '../ReopenPostUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';

const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

describe('ReopenPostUseCase', () => {
  it('reopens a closed_delivered post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'closed_delivered' });
    repo.reopenResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new ReopenPostUseCase(repo);

    const out = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(out.post.status).toBe('open');
    expect(repo.lastReopenArgs).toEqual({ postId: 'p_1' });
  });

  it('reopens a deleted_no_recipient post within grace window', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({
      ownerId: 'u_owner',
      status: 'deleted_no_recipient',
      deleteAfter: future,
    });
    repo.reopenResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new ReopenPostUseCase(repo);

    const out = await uc.execute({ postId: 'p_1', ownerId: 'u_owner' });

    expect(out.post.status).toBe('open');
  });

  it('rejects reopen of deleted_no_recipient past grace', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({
      ownerId: 'u_owner',
      status: 'deleted_no_recipient',
      deleteAfter: past,
    });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'reopen_window_expired',
    });
  });

  it('rejects reopen by non-owner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_other', status: 'closed_delivered' });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'closure_not_owner',
    });
  });

  it('rejects reopen of an already-open post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'closure_wrong_status',
    });
  });

  it('rejects reopen of a removed_admin post', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'removed_admin' });
    const uc = new ReopenPostUseCase(repo);

    await expect(uc.execute({ postId: 'p_1', ownerId: 'u_owner' })).rejects.toMatchObject({
      code: 'closure_wrong_status',
    });
  });
});
