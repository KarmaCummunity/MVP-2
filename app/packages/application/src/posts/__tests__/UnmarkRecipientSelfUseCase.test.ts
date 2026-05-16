import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnmarkRecipientSelfUseCase } from '../UnmarkRecipientSelfUseCase';
import { PostError } from '../errors';
import type { IPostRepository } from '../../ports/IPostRepository';

const makeRepo = (): IPostRepository => {
  const r = {} as IPostRepository;
  r.unmrkRecipientSelf = vi.fn().mockResolvedValue(undefined);
  return r;
};

describe('UnmarkRecipientSelfUseCase', () => {
  let repo: IPostRepository;
  let uc: UnmarkRecipientSelfUseCase;

  beforeEach(() => {
    repo = makeRepo();
    uc = new UnmarkRecipientSelfUseCase(repo);
  });

  it('delegates to repo.unmrkRecipientSelf with the postId', async () => {
    await uc.execute({ postId: 'p1', userId: 'u1' });
    expect(repo.unmrkRecipientSelf).toHaveBeenCalledWith('p1');
  });

  it('throws forbidden when postId is empty', async () => {
    await expect(uc.execute({ postId: '', userId: 'u1' })).rejects.toBeInstanceOf(PostError);
  });

  it('throws forbidden when userId is empty', async () => {
    await expect(uc.execute({ postId: 'p1', userId: '' })).rejects.toBeInstanceOf(PostError);
  });
});
