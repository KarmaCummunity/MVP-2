import { describe, it, expect } from 'vitest';
import { UpdatePostUseCase } from '../UpdatePostUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';

describe('UpdatePostUseCase', () => {
  it('forwards a non-visibility patch and returns the new row', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ postId: 'p_1', visibility: 'Public' });
    repo.updateResult = { ...makePostWithOwner({ postId: 'p_1', title: 'חדש' }) };
    const uc = new UpdatePostUseCase(repo);

    const out = await uc.execute({
      postId: 'p_1',
      viewerId: 'u_1',
      patch: { title: '  חדש  ' },
    });

    expect(out.post.title).toBe('חדש');
    expect(repo.lastUpdateArgs?.patch.title).toBe('חדש');
  });

  it('rejects visibility downgrade (Public → OnlyMe)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ visibility: 'Public' });
    const uc = new UpdatePostUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { visibility: 'OnlyMe' } }),
    ).rejects.toMatchObject({ code: 'visibility_downgrade_forbidden' });
    expect(repo.lastUpdateArgs).toBeNull();
  });

  it('allows visibility upgrade (OnlyMe → Public)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ visibility: 'OnlyMe' });
    repo.updateResult = makePostWithOwner({ visibility: 'Public' });
    const uc = new UpdatePostUseCase(repo);

    await uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { visibility: 'Public' } });
    expect(repo.lastUpdateArgs?.patch.visibility).toBe('Public');
  });

  it('rejects title > 80 chars in patch', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner();
    const uc = new UpdatePostUseCase(repo);
    await expect(
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { title: 'a'.repeat(81) } }),
    ).rejects.toMatchObject({ code: 'title_too_long' });
  });

  it('errors when the post is not found', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new UpdatePostUseCase(repo);
    await expect(
      uc.execute({ postId: 'missing', viewerId: 'u_1', patch: { title: 'x' } }),
    ).rejects.toThrow(/not found/);
  });

  it('rejects editing a non-open post (expired)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ status: 'expired' });
    const uc = new UpdatePostUseCase(repo);
    await expect(
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { title: 'שינוי' } }),
    ).rejects.toMatchObject({ code: 'post_not_open' });
    expect(repo.lastUpdateArgs).toBeNull();
  });

  it('rejects editing a non-open post (removed_admin)', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ status: 'removed_admin' });
    const uc = new UpdatePostUseCase(repo);
    await expect(
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { title: 'שינוי' } }),
    ).rejects.toMatchObject({ code: 'post_not_open' });
    expect(repo.lastUpdateArgs).toBeNull();
  });
});
