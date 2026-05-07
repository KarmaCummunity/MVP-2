/** FR-POST-014: read a single post by id, with viewer-aware visibility (RLS-enforced). */
import type { IPostRepository, PostWithOwner } from '../ports/IPostRepository';

export interface GetPostByIdInput {
  postId: string;
  viewerId: string | null;
}

export interface GetPostByIdOutput {
  post: PostWithOwner | null;
}

export class GetPostByIdUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetPostByIdInput): Promise<GetPostByIdOutput> {
    const post = await this.repo.findById(input.postId, input.viewerId);
    return { post };
  }
}
