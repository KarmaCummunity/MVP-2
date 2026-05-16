/** FR-POST-014: read a single post by id, with viewer-aware visibility (RLS-enforced). */
import type { IPostRepository, PostWithOwner } from '../ports/IPostRepository';

export interface GetPostByIdInput {
  postId: string;
  viewerId: string | null;
  /**
   * When opening post detail from a user's "closed posts" profile grid, pass that profile's user id
   * so D-31 `hide_from_counterparty` projection can apply (query param `fromProfile` on mobile).
   */
  identityListingHostUserId?: string | null;
}

export interface GetPostByIdOutput {
  post: PostWithOwner | null;
}

export class GetPostByIdUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetPostByIdInput): Promise<GetPostByIdOutput> {
    const post = await this.repo.findById(input.postId, input.viewerId, {
      identityListingHostUserId: input.identityListingHostUserId ?? null,
    });
    return { post };
  }
}
