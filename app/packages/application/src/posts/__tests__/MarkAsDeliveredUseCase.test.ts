import { describe, it, expect } from 'vitest';
import { MarkAsDeliveredUseCase } from '../MarkAsDeliveredUseCase';
import {
  FakePostRepository,
  makePostWithOwner,
  makeClosureCandidate,
} from './fakePostRepository';
import type { Post } from '@kc/domain';

const baseClosed = (overrides: Partial<Post> = {}): Post => ({
  ...makePostWithOwner(),
  status: 'closed_delivered',
  ...overrides,
});

describe('MarkAsDeliveredUseCase', () => {
  it('closes with a recipient when one is provided', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    repo.closureCandidatesResult = [makeClosureCandidate({ userId: 'u_recipient' })];
    repo.closeResult = baseClosed();
    const uc = new MarkAsDeliveredUseCase(repo);

    const out = await uc.execute({
      postId: 'p_1',
      ownerId: 'u_owner',
      recipientUserId: 'u_recipient',
    });

    expect(out.post.status).toBe('closed_delivered');
    expect(repo.lastCloseArgs).toEqual({ postId: 'p_1', recipientUserId: 'u_recipient' });
  });

  it('closes without a recipient when null is provided', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    repo.closeResult = baseClosed({ status: 'deleted_no_recipient' });
    const uc = new MarkAsDeliveredUseCase(repo);

    const out = await uc.execute({
      postId: 'p_1',
      ownerId: 'u_owner',
      recipientUserId: null,
    });

    expect(out.post.status).toBe('deleted_no_recipient');
    expect(repo.lastCloseArgs).toEqual({ postId: 'p_1', recipientUserId: null });
  });

  it('rejects when caller is not the owner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_other', status: 'open' });
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', ownerId: 'u_owner', recipientUserId: null }),
    ).rejects.toMatchObject({ code: 'closure_not_owner' });
  });

  it('rejects when post is not open', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'closed_delivered' });
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', ownerId: 'u_owner', recipientUserId: null }),
    ).rejects.toMatchObject({ code: 'closure_wrong_status' });
  });

  it('rejects when recipient is not a chat partner', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = makePostWithOwner({ ownerId: 'u_owner', status: 'open' });
    repo.closureCandidatesResult = [makeClosureCandidate({ userId: 'u_someone_else' })];
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_1', ownerId: 'u_owner', recipientUserId: 'u_imposter' }),
    ).rejects.toMatchObject({ code: 'closure_recipient_not_in_chat' });
  });

  it('rejects when post does not exist', async () => {
    const repo = new FakePostRepository();
    repo.findByIdResult = null;
    const uc = new MarkAsDeliveredUseCase(repo);

    await expect(
      uc.execute({ postId: 'p_missing', ownerId: 'u_owner', recipientUserId: null }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
