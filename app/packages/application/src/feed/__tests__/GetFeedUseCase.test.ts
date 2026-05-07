import { describe, it, expect } from 'vitest';
import { GetFeedUseCase } from '../GetFeedUseCase';
import { FakePostRepository, makePostWithOwner } from '../../posts/__tests__/fakePostRepository';

describe('GetFeedUseCase', () => {
  it('forwards filter / limit / cursor to the repo', async () => {
    const repo = new FakePostRepository();
    repo.posts = [makePostWithOwner({ postId: 'p_1' })];
    const uc = new GetFeedUseCase(repo);

    const out = await uc.execute({
      viewerId: 'viewer_1',
      filter: { type: 'Give', city: 'tel-aviv' },
      limit: 15,
      cursor: 'cursor_x',
    });

    expect(out.posts).toHaveLength(1);
    expect(out.posts[0]!.postId).toBe('p_1');
    expect(repo.lastGetFeedArgs).toEqual({
      viewerId: 'viewer_1',
      filter: { type: 'Give', city: 'tel-aviv' },
      limit: 15,
      cursor: 'cursor_x',
    });
  });

  it('trims a non-empty searchQuery and drops empty / whitespace-only queries', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: { searchQuery: '   ' }, limit: 20 });
    expect(repo.lastGetFeedArgs?.filter.searchQuery).toBeUndefined();

    await uc.execute({ viewerId: null, filter: { searchQuery: '  ספה  ' }, limit: 20 });
    expect(repo.lastGetFeedArgs?.filter.searchQuery).toBe('ספה');
  });

  it('clamps limit to [1, 100]', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: {}, limit: 0 });
    expect(repo.lastGetFeedArgs?.limit).toBe(1);

    await uc.execute({ viewerId: null, filter: {}, limit: 999 });
    expect(repo.lastGetFeedArgs?.limit).toBe(100);
  });

  it('uses sensible defaults when caller omits limit', async () => {
    const repo = new FakePostRepository();
    const uc = new GetFeedUseCase(repo);

    await uc.execute({ viewerId: null, filter: {} });
    expect(repo.lastGetFeedArgs?.limit).toBe(20);
  });
});
