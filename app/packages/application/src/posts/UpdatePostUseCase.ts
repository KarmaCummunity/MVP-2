/** FR-POST-008 + FR-POST-009: edit an existing post; visibility upgrade-only. */
import type { IPostRepository, UpdatePostInput } from '../ports/IPostRepository';
import type { Post } from '@kc/domain';
import { canUpgradeVisibility, TITLE_MAX_CHARS, DESCRIPTION_MAX_CHARS } from '@kc/domain';
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
      throw new PostError('post_not_open', `cannot edit post with status ${current.status}`);
    }

    const patch = this.validate(input.patch, current.visibility);
    const post = await this.repo.update(input.postId, patch);
    return { post };
  }

  private validate(raw: UpdatePostInput, currentVisibility: Post['visibility']): UpdatePostInput {
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

    if (patch.visibility && patch.visibility !== currentVisibility) {
      if (!canUpgradeVisibility(currentVisibility, patch.visibility))
        throw new PostError('visibility_downgrade_forbidden', 'visibility_downgrade_forbidden');
    }

    return patch;
  }
}
