/** FR-POST-008 + FR-POST-009: edit an existing post; visibility may change freely (D-32). */
import type { IPostRepository, UpdatePostInput } from '../ports/IPostRepository';
import type { Post } from '@kc/domain';
import { TITLE_MAX_CHARS, DESCRIPTION_MAX_CHARS, MAX_MEDIA_ASSETS } from '@kc/domain';
import { PostError } from './errors';

export interface UpdatePostUseCaseInput {
  postId: string;
  viewerId: string;
  patch: UpdatePostInput;
}

export interface UpdatePostOutput {
  post: Post;
}

export class UpdatePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: UpdatePostUseCaseInput): Promise<UpdatePostOutput> {
    const current = await this.repo.findById(input.postId, input.viewerId);
    if (!current) throw new Error(`UpdatePostUseCase: post ${input.postId} not found`);

    if (current.status !== 'open') {
      // FR-POST-009 + D-33: on closed_delivered / deleted_no_recipient, only a
      // visibility-only patch is allowed (owner-driven Hide / Unhide).
      // removed_admin and expired remain fully locked.
      const isClosedHideable =
        current.status === 'closed_delivered' || current.status === 'deleted_no_recipient';
      const patchKeys = Object.keys(input.patch).filter(
        (k) => (input.patch as Record<string, unknown>)[k] !== undefined,
      );
      const isVisibilityOnly = patchKeys.length === 1 && patchKeys[0] === 'visibility';
      if (!(isClosedHideable && isVisibilityOnly)) {
        throw new PostError('post_not_open', `cannot edit post with status ${current.status}`);
      }
    }

    const patch = this.validate(input.patch, current);
    const post = await this.repo.update(input.postId, patch);
    return { post };
  }

  private validate(raw: UpdatePostInput, current: Post): UpdatePostInput {
    const patch: UpdatePostInput = { ...raw };

    if (typeof patch.title === 'string') {
      const t = patch.title.trim();
      if (t.length === 0) throw new PostError('title_required', 'title_required');
      if (t.length > TITLE_MAX_CHARS)
        throw new PostError('title_too_long', `title_too_long (>${TITLE_MAX_CHARS})`);
      patch.title = t;
    }

    if (typeof patch.description === 'string' || patch.description === null) {
      const d = patch.description?.trim() ?? null;
      if (d && d.length > DESCRIPTION_MAX_CHARS)
        throw new PostError('description_too_long', `description_too_long (>${DESCRIPTION_MAX_CHARS})`);
      patch.description = d;
    }

    if (typeof patch.urgency === 'string' || patch.urgency === null) {
      const u = patch.urgency?.trim() ?? null;
      patch.urgency = u && u.length > 0 ? u : null;
    }

    if (patch.address) {
      if (!patch.address.city || !patch.address.street || !patch.address.streetNumber)
        throw new PostError('address_required', 'address_required');
    }

    if (patch.mediaAssets !== undefined) {
      if (patch.mediaAssets.length > MAX_MEDIA_ASSETS)
        throw new PostError('too_many_media_assets', `too_many_media_assets (>${MAX_MEDIA_ASSETS})`);
      if (current.type === 'Give' && patch.mediaAssets.length === 0)
        throw new PostError('image_required_for_give', 'image_required_for_give');
    }

    return patch;
  }
}
