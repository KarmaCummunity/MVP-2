/** FR-PROFILE-016 AC3 — paginated saved posts still visible to the viewer. */
import type { ISavedPostsRepository } from '../ports/ISavedPostsRepository';
import type { Post } from '@kc/domain';

export interface ListSavedPostsInput {
  limit?: number;
  cursor?: string;
}

export interface ListSavedPostsOutput {
  posts: Post[];
  nextCursor: string | null;
}

const DEFAULT_LIMIT = 20;
const HARD_MAX = 100;

export class ListSavedPostsUseCase {
  constructor(private readonly repo: ISavedPostsRepository) {}

  async execute(input: ListSavedPostsInput = {}): Promise<ListSavedPostsOutput> {
    const limit = clamp(input.limit ?? DEFAULT_LIMIT, 1, HARD_MAX);
    return this.repo.listSavedPosts(limit, input.cursor);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}
