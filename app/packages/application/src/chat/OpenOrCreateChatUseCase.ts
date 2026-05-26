/** FR-CHAT-004 AC1 + FR-CHAT-006 + FR-RIDE-005 — locates or creates the chat. First-anchor-wins. */
import type { Chat } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';
import { ChatError } from './errors';

export interface OpenOrCreateChatInput {
  viewerId: string;
  otherUserId: string;
  anchorPostId?: string;
  anchorRideId?: string;
  /** When true, always insert a new non-support chat row (after personal hide). */
  preferNewThread?: boolean;
}

export class OpenOrCreateChatUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: OpenOrCreateChatInput): Promise<Chat> {
    if (input.anchorPostId && input.anchorRideId) {
      throw new ChatError('both_anchors_forbidden', 'anchorPostId and anchorRideId are mutually exclusive');
    }
    return this.repo.findOrCreateChat(
      input.viewerId,
      input.otherUserId,
      {
        postId: input.anchorPostId,
        rideId: input.anchorRideId,
      },
      { preferNewThread: input.preferNewThread },
    );
  }
}
