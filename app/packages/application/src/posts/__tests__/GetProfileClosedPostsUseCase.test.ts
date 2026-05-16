import { describe, it, expect } from 'vitest';
import { GetProfileClosedPostsUseCase } from '../GetProfileClosedPostsUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('GetProfileClosedPostsUseCase', () => {
  it('forwards profileUserId / viewerUserId / limit / cursor', async () => {
    const repo = new FakePostRepository();
    const uc = new GetProfileClosedPostsUseCase(repo);

    await uc.execute({
      profileUserId: 'u_profile',
      viewerUserId: 'u_viewer',
      limit: 50,
      cursor: 'cur',
    });

    expect(repo.lastGetProfileClosedPostsArgs).toEqual({
      profileUserId: 'u_profile',
      viewerUserId: 'u_viewer',
      limit: 50,
      cursor: 'cur',
    });
  });

  it('clamps limit to [1, 100]; defaults to 30', async () => {
    const repo = new FakePostRepository();
    const uc = new GetProfileClosedPostsUseCase(repo);

    await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 0 });
    expect(repo.lastGetProfileClosedPostsArgs?.limit).toBe(1);

    await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 999 });
    expect(repo.lastGetProfileClosedPostsArgs?.limit).toBe(100);

    await uc.execute({ profileUserId: 'u', viewerUserId: 'v' });
    expect(repo.lastGetProfileClosedPostsArgs?.limit).toBe(30);
  });

  it('accepts a null viewer (anonymous read)', async () => {
    const repo = new FakePostRepository();
    const uc = new GetProfileClosedPostsUseCase(repo);

    await uc.execute({ profileUserId: 'u', viewerUserId: null });
    expect(repo.lastGetProfileClosedPostsArgs?.viewerUserId).toBeNull();
  });

  it('returns items from the repo verbatim', async () => {
    const repo = new FakePostRepository();
    repo.profileClosedPostsResult = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p1' } as any, identityRole: 'publisher', closedAt: '2026-05-10T10:00:00.000Z' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p2' } as any, identityRole: 'respondent', closedAt: '2026-05-09T10:00:00.000Z' },
    ];
    const uc = new GetProfileClosedPostsUseCase(repo);

    const { items } = await uc.execute({ profileUserId: 'u', viewerUserId: 'v' });
    expect(items.map((i) => [i.post.postId, i.identityRole])).toEqual([
      ['p1', 'publisher'],
      ['p2', 'respondent'],
    ]);
  });

  it('returns nextCursor = last closedAt when page fills the limit', async () => {
    const repo = new FakePostRepository();
    repo.profileClosedPostsResult = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p1' } as any, identityRole: 'publisher', closedAt: '2026-05-10T10:00:00.000Z' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p2' } as any, identityRole: 'respondent', closedAt: '2026-05-09T10:00:00.000Z' },
    ];
    const uc = new GetProfileClosedPostsUseCase(repo);

    const { nextCursor } = await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 2 });
    expect(nextCursor).toBe('2026-05-09T10:00:00.000Z');
  });

  it('returns nextCursor = null when page is short (end of stream)', async () => {
    const repo = new FakePostRepository();
    repo.profileClosedPostsResult = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p1' } as any, identityRole: 'publisher', closedAt: '2026-05-10T10:00:00.000Z' },
    ];
    const uc = new GetProfileClosedPostsUseCase(repo);

    const { nextCursor } = await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 30 });
    expect(nextCursor).toBeNull();
  });

  it('returns nextCursor = null on empty result', async () => {
    const repo = new FakePostRepository();
    repo.profileClosedPostsResult = [];
    const uc = new GetProfileClosedPostsUseCase(repo);

    const { items, nextCursor } = await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 30 });
    expect(items).toEqual([]);
    expect(nextCursor).toBeNull();
  });
});
