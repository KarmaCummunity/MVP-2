import { describe, it, expect } from 'vitest';
import { CreatePostUseCase } from '../CreatePostUseCase';
import { FakePostRepository, makePostWithOwner } from './fakePostRepository';
import type { CreatePostInput } from '../../ports/IPostRepository';

const baseInput = (overrides: Partial<CreatePostInput> = {}): CreatePostInput => ({
  ownerId: 'u_1',
  type: 'Give',
  visibility: 'Public',
  title: 'ספה',
  description: null,
  category: 'Furniture',
  address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'אלנבי', streetNumber: '10' },
  locationDisplayLevel: 'CityAndStreet',
  itemCondition: 'Good',
  urgency: null,
  mediaAssets: [{ path: 'u_1/b1/0.jpg', mimeType: 'image/jpeg', sizeBytes: 100_000 }],
  ...overrides,
});

describe('CreatePostUseCase', () => {
  it('creates a Give post with one image and trims the title', async () => {
    const repo = new FakePostRepository();
    repo.createResult = { ...makePostWithOwner(), title: 'ספה' };
    const uc = new CreatePostUseCase(repo);

    const out = await uc.execute(baseInput({ title: '   ספה   ' }));

    expect(out.post.postId).toBe('p_1');
    expect(repo.lastCreateArgs?.title).toBe('ספה');
  });

  it('rejects empty title', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ title: '   ' }))).rejects.toMatchObject({ code: 'title_required' });
  });

  it('rejects title > 80 chars', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ title: 'a'.repeat(81) }))).rejects.toMatchObject({ code: 'title_too_long' });
  });

  it('rejects description > 500 chars', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ description: 'a'.repeat(501) }))).rejects.toMatchObject({
      code: 'description_too_long',
    });
  });

  it('rejects Give without any image (FR-POST-002 AC1)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ mediaAssets: [] }))).rejects.toMatchObject({
      code: 'image_required_for_give',
    });
  });

  it('rejects > 5 mediaAssets (FR-POST-005 AC2)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    const six = Array.from({ length: 6 }, (_, i) => ({
      path: `u_1/b1/${i}.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 100_000,
    }));
    await expect(uc.execute(baseInput({ mediaAssets: six }))).rejects.toMatchObject({
      code: 'too_many_media_assets',
    });
  });

  it('rejects Give without itemCondition', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(baseInput({ itemCondition: null }))).rejects.toMatchObject({
      code: 'condition_required_for_give',
    });
  });

  it('rejects Request that has itemCondition (FR-POST-004 coupling)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(
      uc.execute(baseInput({ type: 'Request', itemCondition: 'Good', mediaAssets: [] })),
    ).rejects.toMatchObject({ code: 'condition_only_for_give' });
  });

  it('rejects Give that has urgency (FR-POST-004 coupling)', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(
      uc.execute(baseInput({ urgency: 'דחוף' })),
    ).rejects.toMatchObject({ code: 'urgency_only_for_request' });
  });

  it('accepts Request with no images and a free-text urgency', async () => {
    const repo = new FakePostRepository();
    repo.createResult = { ...makePostWithOwner({ type: 'Request' }) };
    const uc = new CreatePostUseCase(repo);

    const out = await uc.execute(
      baseInput({
        type: 'Request',
        itemCondition: null,
        mediaAssets: [],
        urgency: 'עד שישי',
      }),
    );

    expect(out.post.type).toBe('Request');
    expect(repo.lastCreateArgs?.urgency).toBe('עד שישי');
  });

  it('rejects empty address.city / street / streetNumber', async () => {
    const repo = new FakePostRepository();
    const uc = new CreatePostUseCase(repo);
    await expect(
      uc.execute(baseInput({ address: { city: '', cityName: '', street: '', streetNumber: '' } })),
    ).rejects.toMatchObject({ code: 'address_required' });
  });
});
