/** FR-POST-001..005: validate inputs and forward to IPostRepository.create. */
import type { CreatePostInput, IPostRepository } from '../ports/IPostRepository';
import type { Post } from '@kc/domain';
import { TITLE_MAX_CHARS, DESCRIPTION_MAX_CHARS, MAX_MEDIA_ASSETS, STREET_NUMBER_PATTERN } from '@kc/domain';
import { PostError } from './errors';

export interface CreatePostOutput {
  post: Post;
}

export class CreatePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: CreatePostInput): Promise<CreatePostOutput> {
    const normalized = this.validate(input);
    const post = await this.repo.create(normalized);
    return { post };
  }

  private validate(input: CreatePostInput): CreatePostInput {
    const title = input.title.trim();
    if (title.length === 0) throw new PostError('title_required', 'title_required');
    if (title.length > TITLE_MAX_CHARS)
      throw new PostError('title_too_long', `title_too_long (>${TITLE_MAX_CHARS})`);

    const description = input.description?.trim() ?? null;
    if (description && description.length > DESCRIPTION_MAX_CHARS)
      throw new PostError('description_too_long', `description_too_long (>${DESCRIPTION_MAX_CHARS})`);

    if (!input.address.city || !input.address.street || !input.address.streetNumber)
      throw new PostError('address_required', 'address_required');

    if (!STREET_NUMBER_PATTERN.test(input.address.streetNumber.trim()))
      throw new PostError('street_number_invalid', 'street_number_invalid');

    if (input.mediaAssets.length > MAX_MEDIA_ASSETS)
      throw new PostError('too_many_media_assets', `too_many_media_assets (>${MAX_MEDIA_ASSETS})`);

    if (input.type === 'Give') {
      if (input.mediaAssets.length === 0)
        throw new PostError('image_required_for_give', 'image_required_for_give');
      if (input.itemCondition === null)
        throw new PostError('condition_required_for_give', 'condition_required_for_give');
      if (input.urgency !== null && input.urgency.trim().length > 0)
        throw new PostError('urgency_only_for_request', 'urgency_only_for_request');
    } else {
      // Request
      if (input.itemCondition !== null)
        throw new PostError('condition_only_for_give', 'condition_only_for_give');
    }

    const urgency = input.urgency?.trim() ?? null;
    return {
      ...input,
      title,
      description,
      urgency: urgency && urgency.length > 0 ? urgency : null,
    };
  }
}
